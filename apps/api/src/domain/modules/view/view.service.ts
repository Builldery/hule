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
import {
  CreateViewDto,
  ViewListRefInputDto,
} from '../../entity/view/create-view.dto';
import { UpdateViewDto } from '../../entity/view/update-view.dto';
import { PinService } from '../pin/pin.service';
import { EPinEntity } from '../../entity/pin/pin.constants';
import { SpaceShareService } from '../space-share/space-share.service';
import { toOid } from '../../entity/common/to-oid';

@Injectable()
export class ViewService {
  @InjectModel(View.name) private viewModel: Model<ViewDocument>;
  @InjectModel(List.name) private listModel: Model<ListDocument>;

  constructor(
    private readonly pinService: PinService,
    private readonly spaceShareService: SpaceShareService,
  ) {}

  async getAll(wsId: string, userId: string): Promise<Array<ViewDto>> {
    const userOid = toOid(userId);
    const docs = await this.viewModel
      .find({
        workspaceId: toOid(wsId),
        $or: [{ userId: userOid }, { userId: null }],
      })
      .sort({ createdAt: 1 });
    return (docs ?? []).map((d) => new ViewDto(d));
  }

  async getById(wsId: string, userId: string, id: string): Promise<ViewDto> {
    const userOid = toOid(userId);
    const doc = await this.viewModel.findOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
      $or: [{ userId: userOid }, { userId: null }],
    });
    if (!doc) throw new NotFoundException('View not found');
    return new ViewDto(doc);
  }

  async create(
    wsId: string,
    userId: string,
    dto: CreateViewDto,
  ): Promise<ViewDto> {
    const wsOid = toOid(wsId);
    const userOid = toOid(userId);
    const refs = await this.resolveListRefs(wsOid, userOid, dto.listRefs);
    const created = await this.viewModel.create({
      workspaceId: wsOid,
      userId: userOid,
      label: dto.label,
      kind: dto.kind,
      listRefs: refs,
      listIds: [],
    });
    return new ViewDto(created);
  }

  async update(
    wsId: string,
    userId: string,
    id: string,
    patch: UpdateViewDto,
  ): Promise<ViewDto> {
    const wsOid = toOid(wsId);
    const userOid = toOid(userId);
    const set: Record<string, unknown> = {};
    if (patch.label !== undefined) set.label = patch.label;
    if (patch.kind !== undefined) set.kind = patch.kind;
    if (patch.listRefs !== undefined) {
      set.listRefs = await this.resolveListRefs(wsOid, userOid, patch.listRefs);
      set.listIds = [];
    }
    const doc = await this.viewModel.findOneAndUpdate(
      {
        _id: toOid(id),
        workspaceId: wsOid,
        $or: [{ userId: userOid }, { userId: null }],
      },
      { $set: set },
      { new: true },
    );
    if (!doc) throw new NotFoundException('View not found');
    return new ViewDto(doc);
  }

  async delete(wsId: string, userId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const userOid = toOid(userId);
    const oid = toOid(id);
    const res = await this.viewModel.deleteOne({
      _id: oid,
      workspaceId: wsOid,
      $or: [{ userId: userOid }, { userId: null }],
    });
    if (res.deletedCount === 0) throw new NotFoundException('View not found');
    await this.pinService.deleteByEntity(wsOid, EPinEntity.View, [oid]);
  }

  async pullListIds(
    wsOid: Types.ObjectId,
    listIds: Array<Types.ObjectId>,
  ): Promise<void> {
    if (!listIds.length) return;
    await this.viewModel.updateMany(
      {
        $or: [
          { listIds: { $in: listIds } },
          { 'listRefs.listId': { $in: listIds } },
        ],
      },
      {
        $pull: {
          listIds: { $in: listIds },
          listRefs: { listId: { $in: listIds } },
        },
      },
    );
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.viewModel.deleteMany({
      $or: [{ workspaceId: wsOid }, { 'listRefs.workspaceId': wsOid }],
    });
  }

  private async resolveListRefs(
    wsOid: Types.ObjectId,
    userOid: Types.ObjectId,
    refs: Array<ViewListRefInputDto> | undefined,
  ): Promise<Array<{ listId: Types.ObjectId; workspaceId: Types.ObjectId }>> {
    if (!refs || refs.length === 0) return [];

    const out: Array<{ listId: Types.ObjectId; workspaceId: Types.ObjectId }> = [];

    const ownLists = refs.filter((r) => r.workspaceId === wsOid.toHexString());
    if (ownLists.length) {
      const oids = ownLists.map((r) => toOid(r.listId));
      const found = await this.listModel.countDocuments({
        _id: { $in: oids },
        workspaceId: wsOid,
      });
      if (found !== oids.length) {
        throw new BadRequestException(
          'One or more listIds do not belong to this workspace',
        );
      }
      for (const r of ownLists) {
        out.push({ listId: toOid(r.listId), workspaceId: wsOid });
      }
    }

    const foreign = refs.filter((r) => r.workspaceId !== wsOid.toHexString());
    for (const r of foreign) {
      const list = await this.spaceShareService.assertReadAccessToList(
        toOid(r.listId),
        userOid,
      );
      if (list.workspaceId.toHexString() !== r.workspaceId) {
        throw new BadRequestException(
          'workspaceId does not match the list owner workspace',
        );
      }
      out.push({ listId: list._id as Types.ObjectId, workspaceId: list.workspaceId });
    }

    return out;
  }
}
