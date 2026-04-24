import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { List, ListDocument } from '../../../adapters/mongo/list.schema';
import { Space } from '../../../adapters/mongo/space.schema';
import { ListDto } from '../../entity/list/list.dto';
import { CreateListDto } from '../../entity/list/create-list.dto';
import { UpdateListDto } from '../../entity/list/update-list.dto';
import { ReorderItemDto } from '../../entity/common/reorder.dto';
import { TaskService } from '../task/task.service';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class ListService {
  @InjectModel(List.name) private listModel: Model<ListDocument>;
  @InjectModel(Space.name) private spaceModel: Model<Space>;

  constructor(private readonly taskService: TaskService) {}

  async getBySpace(wsId: string, spaceId: string): Promise<Array<ListDto>> {
    const docs = await this.listModel
      .find({ workspaceId: toOid(wsId), spaceId: toOid(spaceId) })
      .sort({ order: 1 });
    return (docs ?? []).map((d) => new ListDto(d));
  }

  async create(wsId: string, dto: CreateListDto): Promise<ListDto> {
    const wsOid = toOid(wsId);
    const spaceOid = toOid(dto.spaceId);
    const space = await this.spaceModel.findOne({
      _id: spaceOid,
      workspaceId: wsOid,
    });
    if (!space) throw new BadRequestException('Space not found');
    const last = await this.listModel
      .findOne({ workspaceId: wsOid, spaceId: spaceOid })
      .sort({ order: -1 });
    const order = (last?.order ?? -1) + 1;
    const created = await this.listModel.create({
      workspaceId: wsOid,
      spaceId: spaceOid,
      name: dto.name,
      order,
    });
    return new ListDto(created);
  }

  async update(
    wsId: string,
    id: string,
    patch: UpdateListDto,
  ): Promise<ListDto> {
    const doc = await this.listModel.findOneAndUpdate(
      { _id: toOid(id), workspaceId: toOid(wsId) },
      { $set: patch },
      { new: true },
    );
    if (!doc) throw new NotFoundException('List not found');
    return new ListDto(doc);
  }

  async delete(wsId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const res = await this.listModel.deleteOne({ _id: oid, workspaceId: wsOid });
    if (res.deletedCount === 0) throw new NotFoundException('List not found');
    await this.taskService.deleteByListIds(wsOid, [oid]);
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
    if (ops.length) await this.listModel.bulkWrite(ops as any);
  }

  async deleteBySpaceId(
    wsOid: Types.ObjectId,
    spaceOid: Types.ObjectId,
    listIds: Array<Types.ObjectId>,
  ): Promise<void> {
    await this.listModel.deleteMany({ workspaceId: wsOid, spaceId: spaceOid });
    await this.taskService.deleteByListIds(wsOid, listIds);
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.taskService.deleteByWorkspaceId(wsOid);
    await this.listModel.deleteMany({ workspaceId: wsOid });
  }
}
