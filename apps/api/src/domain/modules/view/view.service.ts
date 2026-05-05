import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { View, ViewDocument } from '../../../adapters/mongo/view.schema';
import { List, ListDocument } from '../../../adapters/mongo/list.schema';
import { ViewDto } from '../../entity/view/view.dto';
import { CreateViewDto } from '../../entity/view/create-view.dto';
import { UpdateViewDto } from '../../entity/view/update-view.dto';
import { PinService } from '../pin/pin.service';
import { EPinEntity } from '../../entity/pin/pin.constants';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class ViewService {
  @InjectModel(View.name) private viewModel: Model<ViewDocument>;
  @InjectModel(List.name) private listModel: Model<ListDocument>;

  constructor(private readonly pinService: PinService) {}

  async getAll(wsId: string): Promise<Array<ViewDto>> {
    const docs = await this.viewModel
      .find({ workspaceId: toOid(wsId) })
      .sort({ createdAt: 1 });
    return (docs ?? []).map((d) => new ViewDto(d));
  }

  async getById(wsId: string, id: string): Promise<ViewDto> {
    const doc = await this.viewModel.findOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
    });
    if (!doc) throw new NotFoundException('View not found');
    return new ViewDto(doc);
  }

  async create(wsId: string, dto: CreateViewDto): Promise<ViewDto> {
    const wsOid = toOid(wsId);
    const listOids = await this.resolveListIds(wsOid, dto.listIds);
    const created = await this.viewModel.create({
      workspaceId: wsOid,
      label: dto.label,
      kind: dto.kind,
      listIds: listOids,
    });
    return new ViewDto(created);
  }

  async update(
    wsId: string,
    id: string,
    patch: UpdateViewDto,
  ): Promise<ViewDto> {
    const wsOid = toOid(wsId);
    const set: Record<string, unknown> = {};
    if (patch.label !== undefined) set.label = patch.label;
    if (patch.kind !== undefined) set.kind = patch.kind;
    if (patch.listIds !== undefined) {
      set.listIds = await this.resolveListIds(wsOid, patch.listIds);
    }
    const doc = await this.viewModel.findOneAndUpdate(
      { _id: toOid(id), workspaceId: wsOid },
      { $set: set },
      { new: true },
    );
    if (!doc) throw new NotFoundException('View not found');
    return new ViewDto(doc);
  }

  async delete(wsId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const res = await this.viewModel.deleteOne({ _id: oid, workspaceId: wsOid });
    if (res.deletedCount === 0) throw new NotFoundException('View not found');
    await this.pinService.deleteByEntity(wsOid, EPinEntity.View, [oid]);
  }

  async pullListIds(
    wsOid: Types.ObjectId,
    listIds: Array<Types.ObjectId>,
  ): Promise<void> {
    if (!listIds.length) return;
    await this.viewModel.updateMany(
      { workspaceId: wsOid, listIds: { $in: listIds } },
      { $pull: { listIds: { $in: listIds } } },
    );
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.viewModel.deleteMany({ workspaceId: wsOid });
  }

  private async resolveListIds(
    wsOid: Types.ObjectId,
    listIds: Array<string> | undefined,
  ): Promise<Array<Types.ObjectId>> {
    if (!listIds || listIds.length === 0) return [];
    const oids = listIds.map((x) => toOid(x));
    const found = await this.listModel.countDocuments({
      _id: { $in: oids },
      workspaceId: wsOid,
    });
    if (found !== oids.length) {
      throw new BadRequestException(
        'One or more listIds do not belong to this workspace',
      );
    }
    return oids;
  }
}
