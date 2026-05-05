import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pin, PinDocument } from '../../../adapters/mongo/pin.schema';
import { PinDto } from '../../entity/pin/pin.dto';
import { CreatePinDto } from '../../entity/pin/create-pin.dto';
import { UpdatePinDto } from '../../entity/pin/update-pin.dto';
import { EPinEntity } from '../../entity/pin/pin.constants';
import { ReorderItemDto } from '../../entity/common/reorder.dto';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class PinService {
  @InjectModel(Pin.name) private pinModel: Model<PinDocument>;

  async getAll(wsId: string): Promise<Array<PinDto>> {
    const docs = await this.pinModel
      .find({ workspaceId: toOid(wsId) })
      .sort({ order: 1 });
    return (docs ?? []).map((d) => new PinDto(d));
  }

  async create(wsId: string, dto: CreatePinDto): Promise<PinDto> {
    const wsOid = toOid(wsId);
    const last = await this.pinModel
      .findOne({ workspaceId: wsOid })
      .sort({ order: -1 });
    const order = (last?.order ?? -1) + 1;
    const created = await this.pinModel.create({
      workspaceId: wsOid,
      label: dto.label,
      iconName: dto.iconName,
      entity: dto.entity,
      entityId: toOid(dto.entityId),
      order,
    });
    return new PinDto(created);
  }

  async update(
    wsId: string,
    id: string,
    patch: UpdatePinDto,
  ): Promise<PinDto> {
    const doc = await this.pinModel.findOneAndUpdate(
      { _id: toOid(id), workspaceId: toOid(wsId) },
      { $set: patch },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Pin not found');
    return new PinDto(doc);
  }

  async delete(wsId: string, id: string): Promise<void> {
    const res = await this.pinModel.deleteOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
    });
    if (res.deletedCount === 0) throw new NotFoundException('Pin not found');
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
    if (ops.length) await this.pinModel.bulkWrite(ops as any);
  }

  async deleteByEntity(
    wsOid: Types.ObjectId,
    entity: EPinEntity,
    entityIds: Array<Types.ObjectId>,
  ): Promise<void> {
    if (!entityIds.length) return;
    await this.pinModel.deleteMany({
      workspaceId: wsOid,
      entity,
      entityId: { $in: entityIds },
    });
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.pinModel.deleteMany({ workspaceId: wsOid });
  }
}
