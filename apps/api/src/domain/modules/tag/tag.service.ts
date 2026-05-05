import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tag, TagDocument } from '../../../adapters/mongo/tag.schema';
import { Task } from '../../../adapters/mongo/task.schema';
import { TagDto } from '../../entity/tag/tag.dto';
import { CreateTagDto } from '../../entity/tag/create-tag.dto';
import { UpdateTagDto } from '../../entity/tag/update-tag.dto';
import { ETagColor } from '../../entity/tag/tag.constants';
import { toOid } from '../../entity/common/to-oid';

function isDuplicateKeyError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: number }).code === 11000;
}

@Injectable()
export class TagService {
  @InjectModel(Tag.name) private tagModel: Model<TagDocument>;
  @InjectModel(Task.name) private taskModel: Model<Task>;

  async getByWorkspace(wsId: string): Promise<Array<TagDto>> {
    const docs = await this.tagModel
      .find({ workspaceId: toOid(wsId) })
      .sort({ name: 1 });
    return (docs ?? []).map((d) => new TagDto(d));
  }

  async getById(wsId: string, id: string): Promise<TagDto> {
    const doc = await this.tagModel.findOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
    });
    if (!doc) throw new NotFoundException('Tag not found');
    return new TagDto(doc);
  }

  async create(wsId: string, dto: CreateTagDto): Promise<TagDto> {
    try {
      const doc = await this.tagModel.create({
        workspaceId: toOid(wsId),
        name: dto.name,
        color: dto.color ?? ETagColor.Gray,
      });
      return new TagDto(doc);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictException('Tag with this name already exists');
      }
      throw err;
    }
  }

  async update(wsId: string, id: string, patch: UpdateTagDto): Promise<TagDto> {
    try {
      const doc = await this.tagModel.findOneAndUpdate(
        { _id: toOid(id), workspaceId: toOid(wsId) },
        { $set: patch },
        { new: true },
      );
      if (!doc) throw new NotFoundException('Tag not found');
      return new TagDto(doc);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictException('Tag with this name already exists');
      }
      throw err;
    }
  }

  async delete(wsId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const res = await this.tagModel.deleteOne({ _id: oid, workspaceId: wsOid });
    if (res.deletedCount === 0) throw new NotFoundException('Tag not found');
    await this.taskModel.updateMany(
      { workspaceId: wsOid, tagIds: oid },
      { $pull: { tagIds: oid } },
    );
  }

  async assertTagsInWorkspace(
    wsOid: Types.ObjectId,
    tagOids: Array<Types.ObjectId>,
  ): Promise<void> {
    if (!tagOids.length) return;
    const count = await this.tagModel.countDocuments({
      _id: { $in: tagOids },
      workspaceId: wsOid,
    });
    if (count !== tagOids.length) {
      throw new BadRequestException('One or more tags do not belong to this workspace');
    }
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.tagModel.deleteMany({ workspaceId: wsOid });
  }
}
