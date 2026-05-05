import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Space, SpaceDocument } from '../../../adapters/mongo/space.schema';
import { List } from '../../../adapters/mongo/list.schema';
import { SpaceDto } from '../../entity/space/space.dto';
import { CreateSpaceDto } from '../../entity/space/create-space.dto';
import { UpdateSpaceDto } from '../../entity/space/update-space.dto';
import { ReorderItemDto } from '../../entity/common/reorder.dto';
import { ListService } from '../list/list.service';
import { TaskTemplateService } from '../task-template/task-template.service';
import { RecurringJobService } from '../recurring-job/recurring-job.service';
import { ActionService } from '../action/action.service';
import { PinService } from '../pin/pin.service';
import { EPinEntity } from '../../entity/pin/pin.constants';
import { runBulk } from '../../../adapters/mongo/dispatch-context';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class SpaceService {
  @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>;
  @InjectModel(List.name) private listModel: Model<List>;

  constructor(
    private readonly listService: ListService,
    private readonly taskTemplateService: TaskTemplateService,
    private readonly recurringJobService: RecurringJobService,
    private readonly actionService: ActionService,
    private readonly pinService: PinService,
  ) {}

  async getAll(wsId: string): Promise<Array<SpaceDto>> {
    const docs = await this.spaceModel
      .find({ workspaceId: toOid(wsId) })
      .sort({ order: 1 });
    return (docs ?? []).map((d) => new SpaceDto(d));
  }

  async create(wsId: string, dto: CreateSpaceDto): Promise<SpaceDto> {
    const wsOid = toOid(wsId);
    const last = await this.spaceModel
      .findOne({ workspaceId: wsOid })
      .sort({ order: -1 });
    const order = (last?.order ?? -1) + 1;
    const created = await this.spaceModel.create({
      workspaceId: wsOid,
      name: dto.name,
      color: dto.color,
      iconName: dto.iconName,
      order,
    });
    return new SpaceDto(created);
  }

  async update(
    wsId: string,
    id: string,
    patch: UpdateSpaceDto,
  ): Promise<SpaceDto> {
    const doc = await this.spaceModel.findOneAndUpdate(
      { _id: toOid(id), workspaceId: toOid(wsId) },
      { $set: patch },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Space not found');
    return new SpaceDto(doc);
  }

  async delete(wsId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const existed = await this.spaceModel.findOne({ _id: oid, workspaceId: wsOid });
    if (!existed) throw new NotFoundException('Space not found');
    await runBulk(async () => {
      const lists = await this.listModel
        .find({ spaceId: oid, workspaceId: wsOid })
        .select({ _id: 1 });
      const listIds = lists.map((l) => l._id as Types.ObjectId);
      await this.actionService.deleteBySpaceId(wsOid, oid);
      await this.recurringJobService.deleteBySpaceId(wsOid, oid);
      await this.spaceModel.deleteOne({ _id: oid, workspaceId: wsOid });
      await this.listService.deleteBySpaceId(wsOid, oid, listIds);
      await this.taskTemplateService.deleteBySpaceId(wsOid, oid);
      await this.pinService.deleteByEntity(wsOid, EPinEntity.Space, [oid]);
    });
  }

  async reorder(wsId: string, items: Array<ReorderItemDto>): Promise<void> {
    const wsOid = toOid(wsId);
    const now = new Date();
    const ops = items.map((i) => ({
      updateOne: {
        filter: { _id: toOid(i.id), workspaceId: wsOid },
        update: { $set: { order: i.order, updatedAt: now } },
      },
    }));
    if (ops.length) await this.spaceModel.bulkWrite(ops as any);
  }

  async deleteByWorkspaceId(wsId: Types.ObjectId): Promise<void> {
    await this.listService.deleteByWorkspaceId(wsId);
    await this.taskTemplateService.deleteByWorkspaceId(wsId);
    await this.spaceModel.deleteMany({ workspaceId: wsId });
  }
}
