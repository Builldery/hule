import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Workspace,
  WorkspaceDocument,
} from '../../../adapters/mongo/workspace.schema';
import { WorkspaceDto } from '../../entity/workspace/workspace.dto';
import { CreateWorkspaceDto } from '../../entity/workspace/create-workspace.dto';
import { UpdateWorkspaceDto } from '../../entity/workspace/update-workspace.dto';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';
import { FileService } from '../file/file.service';
import { TagService } from '../tag/tag.service';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class WorkspaceService {
  @InjectModel(Workspace.name)
  private workspaceModel: Model<WorkspaceDocument>;

  constructor(
    private readonly userService: UserService,
    private readonly spaceService: SpaceService,
    private readonly fileService: FileService,
    private readonly tagService: TagService,
  ) {}

  async create(ownerId: string, dto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const ownerOid = toOid(ownerId);
    const doc = await this.workspaceModel.create({
      name: dto.name,
      ownerId: ownerOid,
      memberIds: [ownerOid],
    });
    return new WorkspaceDto(doc);
  }

  async listForUser(userId: string): Promise<Array<WorkspaceDto>> {
    const docs = await this.workspaceModel
      .find({ memberIds: toOid(userId) })
      .sort({ createdAt: 1 });
    return (docs ?? []).map((d) => new WorkspaceDto(d));
  }

  async listIdsForUser(userId: string): Promise<Array<string>> {
    const docs = await this.workspaceModel
      .find({ memberIds: toOid(userId) })
      .select({ _id: 1 })
      .sort({ createdAt: 1 });
    return docs.map((d) => (d._id as Types.ObjectId).toString());
  }

  async findByIdForUser(wsId: string, userId: string): Promise<WorkspaceDto> {
    const doc = await this.loadAsMember(wsId, userId);
    return new WorkspaceDto(doc);
  }

  async rename(
    wsId: string,
    actorId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDto> {
    const doc = await this.loadAsOwner(wsId, actorId);
    if (dto.name !== undefined) doc.name = dto.name;
    await doc.save();
    return new WorkspaceDto(doc);
  }

  async delete(wsId: string, actorId: string): Promise<void> {
    const doc = await this.loadAsOwner(wsId, actorId);
    const wsOid = doc._id as Types.ObjectId;
    await this.spaceService.deleteByWorkspaceId(wsOid);
    await this.fileService.deleteByWorkspaceId(wsOid);
    await this.tagService.deleteByWorkspaceId(wsOid);
    await this.workspaceModel.deleteOne({ _id: wsOid });
  }

  async addMember(
    wsId: string,
    actorId: string,
    login: string,
  ): Promise<WorkspaceDto> {
    const doc = await this.loadAsOwner(wsId, actorId);
    const invitee = await this.userService.findByLogin(login);
    if (!invitee) throw new NotFoundException('User not found');
    const inviteeOid = invitee._id as Types.ObjectId;
    if (doc.memberIds.some((m) => m.toHexString() === inviteeOid.toHexString())) {
      throw new BadRequestException('User is already a member');
    }
    doc.memberIds.push(inviteeOid);
    await doc.save();
    return new WorkspaceDto(doc);
  }

  async removeMember(
    wsId: string,
    actorId: string,
    memberId: string,
  ): Promise<WorkspaceDto> {
    const doc = await this.loadAsMember(wsId, actorId);
    const memberOid = toOid(memberId);
    const isOwner = doc.ownerId.toHexString() === actorId;
    const isSelf = actorId === memberId;

    if (!isOwner && !isSelf) {
      throw new ForbiddenException('Only owner can remove other members');
    }
    if (doc.ownerId.toHexString() === memberOid.toHexString()) {
      throw new BadRequestException(
        'Owner cannot be removed. Delete the workspace instead.',
      );
    }
    if (!doc.memberIds.some((m) => m.toHexString() === memberOid.toHexString())) {
      throw new NotFoundException('Member not found');
    }
    doc.memberIds = doc.memberIds.filter(
      (m) => m.toHexString() !== memberOid.toHexString(),
    );
    await doc.save();
    return new WorkspaceDto(doc);
  }

  async assertMember(wsId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const found = await this.workspaceModel.exists({
      _id: wsId,
      memberIds: userId,
    });
    if (!found) {
      throw new BadRequestException('User is not a member of this workspace');
    }
  }

  private async loadAsMember(
    wsId: string,
    userId: string,
  ): Promise<WorkspaceDocument> {
    const doc = await this.workspaceModel.findOne({
      _id: toOid(wsId),
      memberIds: toOid(userId),
    });
    if (!doc) throw new NotFoundException('Workspace not found');
    return doc;
  }

  private async loadAsOwner(
    wsId: string,
    userId: string,
  ): Promise<WorkspaceDocument> {
    const doc = await this.loadAsMember(wsId, userId);
    if (doc.ownerId.toHexString() !== userId) {
      throw new ForbiddenException('Only the workspace owner can do this');
    }
    return doc;
  }
}
