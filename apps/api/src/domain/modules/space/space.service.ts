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

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class SpaceService {
  @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>;
  @InjectModel(List.name) private listModel: Model<List>;

  constructor(private readonly listService: ListService) {}

  async getAll(): Promise<Array<SpaceDto>> {
    const docs = await this.spaceModel.find().sort({ order: 1 });
    return (docs ?? []).map((d) => new SpaceDto(d));
  }

  async create(dto: CreateSpaceDto): Promise<SpaceDto> {
    const last = await this.spaceModel.findOne().sort({ order: -1 });
    const order = (last?.order ?? -1) + 1;
    const created = await this.spaceModel.create({ ...dto, order });
    return new SpaceDto(created);
  }

  async update(id: string, patch: UpdateSpaceDto): Promise<SpaceDto> {
    const doc = await this.spaceModel.findByIdAndUpdate(toOid(id), { $set: patch }, { new: true });
    if (!doc) throw new NotFoundException('Space not found');
    return new SpaceDto(doc);
  }

  async delete(id: string): Promise<void> {
    const oid = toOid(id);
    const lists = await this.listModel.find({ spaceId: oid }).select({ _id: 1 });
    const listIds = lists.map((l) => l._id as Types.ObjectId);
    await this.spaceModel.deleteOne({ _id: oid });
    await this.listService.deleteBySpaceId(oid, listIds);
  }

  async reorder(items: Array<ReorderItemDto>): Promise<void> {
    const now = new Date();
    const ops = items.map((i) => ({
      updateOne: {
        filter: { _id: toOid(i.id) },
        update: { $set: { order: i.order, updatedAt: now } },
      },
    }));
    await this.spaceModel.bulkWrite(ops as any);
  }
}
