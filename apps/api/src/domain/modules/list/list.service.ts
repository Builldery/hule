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

  async getBySpace(spaceId: string): Promise<Array<ListDto>> {
    const docs = await this.listModel
      .find({ spaceId: toOid(spaceId) })
      .sort({ order: 1 });
    return (docs ?? []).map((d) => new ListDto(d));
  }

  async create(dto: CreateListDto): Promise<ListDto> {
    const spaceOid = toOid(dto.spaceId);
    const space = await this.spaceModel.findById(spaceOid);
    if (!space) throw new BadRequestException('Space not found');
    const last = await this.listModel.findOne({ spaceId: spaceOid }).sort({ order: -1 });
    const order = (last?.order ?? -1) + 1;
    const created = await this.listModel.create({
      spaceId: spaceOid,
      name: dto.name,
      order,
    });
    return new ListDto(created);
  }

  async update(id: string, patch: UpdateListDto): Promise<ListDto> {
    const doc = await this.listModel.findByIdAndUpdate(toOid(id), { $set: patch }, { new: true });
    if (!doc) throw new NotFoundException('List not found');
    return new ListDto(doc);
  }

  async delete(id: string): Promise<void> {
    const oid = toOid(id);
    await this.listModel.deleteOne({ _id: oid });
    await this.taskService.deleteByListIds([oid]);
  }

  async reorder(items: Array<ReorderItemDto>): Promise<void> {
    const now = new Date();
    const ops = items.map((i) => ({
      updateOne: {
        filter: { _id: toOid(i.id) },
        update: { $set: { order: i.order, updatedAt: now } },
      },
    }));
    await this.listModel.bulkWrite(ops as any);
  }

  async deleteBySpaceId(
    spaceOid: Types.ObjectId,
    listIds: Array<Types.ObjectId>,
  ): Promise<void> {
    await this.listModel.deleteMany({ spaceId: spaceOid });
    await this.taskService.deleteByListIds(listIds);
  }
}
