import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Pin, PinDocument } from '../../../adapters/mongo/pin.schema';
import { PinDto } from '../../entity/pin/pin.dto';
import { CreatePinDto } from '../../entity/pin/create-pin.dto';
import { UpdatePinDto } from '../../entity/pin/update-pin.dto';
import { EPinEntity } from '../../entity/pin/pin.constants';
import { ReorderItemDto } from '../../entity/common/reorder.dto';
import { SpaceShareService } from '../space-share/space-share.service';
import { toOid } from '../../entity/common/to-oid';

@Injectable()
export class PinService {
  @InjectModel(Pin.name) private pinModel: Model<PinDocument>;

  constructor(private readonly spaceShareService: SpaceShareService) {}

  async getAll(wsId: string, userId: string): Promise<Array<PinDto>> {
    const userOid = toOid(userId);
    const docs = await this.pinModel
      .find({
        workspaceId: toOid(wsId),
        $or: [{ userId: userOid }, { userId: null }],
      })
      .sort({ order: 1 });
    return (docs ?? []).map((d) => new PinDto(d));
  }

  async create(
    wsId: string,
    userId: string,
    dto: CreatePinDto,
  ): Promise<PinDto> {
    const wsOid = toOid(wsId);
    const userOid = toOid(userId);
    const entityOid = toOid(dto.entityId);
    const entityWsOid = dto.entityWorkspaceId
      ? toOid(dto.entityWorkspaceId)
      : null;

    if (entityWsOid && entityWsOid.toHexString() !== wsOid.toHexString()) {
      await this.assertCanReferenceForeignEntity(
        userOid,
        dto.entity,
        entityOid,
      );
    }

    const last = await this.pinModel
      .findOne({ workspaceId: wsOid, userId: userOid })
      .sort({ order: -1 });
    const order = (last?.order ?? -1) + 1;
    const created = await this.pinModel.create({
      workspaceId: wsOid,
      userId: userOid,
      label: dto.label,
      iconName: dto.iconName,
      entity: dto.entity,
      entityId: entityOid,
      entityWorkspaceId: entityWsOid,
      order,
    });
    return new PinDto(created);
  }

  async update(
    wsId: string,
    userId: string,
    id: string,
    patch: UpdatePinDto,
  ): Promise<PinDto> {
    const userOid = toOid(userId);
    const doc = await this.pinModel.findOneAndUpdate(
      {
        _id: toOid(id),
        workspaceId: toOid(wsId),
        $or: [{ userId: userOid }, { userId: null }],
      },
      { $set: patch },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Pin not found');
    return new PinDto(doc);
  }

  async delete(wsId: string, userId: string, id: string): Promise<void> {
    const userOid = toOid(userId);
    const res = await this.pinModel.deleteOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
      $or: [{ userId: userOid }, { userId: null }],
    });
    if (res.deletedCount === 0) throw new NotFoundException('Pin not found');
  }

  async reorder(
    wsId: string,
    userId: string,
    items: Array<ReorderItemDto>,
  ): Promise<void> {
    const wsOid = toOid(wsId);
    const userOid = toOid(userId);
    const now = new Date();
    const ops = items.map((i) => ({
      updateOne: {
        filter: {
          _id: toOid(i.id),
          workspaceId: wsOid,
          $or: [{ userId: userOid }, { userId: null }],
        },
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
      $or: [
        { workspaceId: wsOid, entity, entityId: { $in: entityIds } },
        { entityWorkspaceId: wsOid, entity, entityId: { $in: entityIds } },
      ],
    });
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.pinModel.deleteMany({
      $or: [{ workspaceId: wsOid }, { entityWorkspaceId: wsOid }],
    });
  }

  private async assertCanReferenceForeignEntity(
    userOid: Types.ObjectId,
    entity: EPinEntity,
    entityOid: Types.ObjectId,
  ): Promise<void> {
    if (entity === EPinEntity.Space) {
      await this.spaceShareService.assertReadAccessToSpace(entityOid, userOid);
      return;
    }
    if (entity === EPinEntity.List) {
      await this.spaceShareService.assertReadAccessToList(entityOid, userOid);
      return;
    }
    throw new BadRequestException(
      'Foreign-workspace pins are only supported for Space and List entities',
    );
  }
}
