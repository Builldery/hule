import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Space, SpaceDocument } from '../../../adapters/mongo/space.schema';
import { List, ListDocument } from '../../../adapters/mongo/list.schema';
import {
  Workspace,
  WorkspaceDocument,
} from '../../../adapters/mongo/workspace.schema';
import { User, UserDocument } from '../../../adapters/mongo/user.schema';
import { SpaceDto } from '../../entity/space/space.dto';
import { ListDto } from '../../entity/list/list.dto';
import {
  SharedSpaceDto,
  SharedSpaceOwnerDto,
} from '../../entity/space/shared-space.dto';
import { ShareSpaceDto } from '../../entity/space/share-space.dto';
import { ESpaceShareRole } from '../../entity/space/space.constants';
import { UserService } from '../user/user.service';
import { toOid } from '../../entity/common/to-oid';

@Injectable()
export class SpaceShareService {
  @InjectModel(Space.name) private spaceModel: Model<SpaceDocument>;
  @InjectModel(List.name) private listModel: Model<ListDocument>;
  @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>;
  @InjectModel(User.name) private userModel: Model<UserDocument>;

  constructor(private readonly userService: UserService) {}

  async share(
    actorId: string,
    spaceId: string,
    dto: ShareSpaceDto,
  ): Promise<SpaceDto> {
    const space = await this.loadSpaceAsWorkspaceOwner(spaceId, actorId);

    const invitee = await this.userService.findByEmail(dto.email);
    if (!invitee) throw new NotFoundException('User not found');
    const inviteeOid = invitee._id as Types.ObjectId;

    if (inviteeOid.toHexString() === actorId) {
      throw new BadRequestException('Cannot share with yourself');
    }

    const role = dto.role ?? ESpaceShareRole.Viewer;

    const existing = space.sharedWith.find(
      (e) => e.userId.toHexString() === inviteeOid.toHexString(),
    );
    if (existing) {
      existing.role = role;
    } else {
      space.sharedWith.push({ userId: inviteeOid, role });
    }
    await space.save();
    return new SpaceDto(space);
  }

  async unshare(
    actorId: string,
    spaceId: string,
    targetUserId: string,
  ): Promise<SpaceDto> {
    const space = await this.loadSpaceAsWorkspaceOwner(spaceId, actorId);
    space.sharedWith = space.sharedWith.filter(
      (e) => e.userId.toHexString() !== targetUserId,
    );
    await space.save();
    return new SpaceDto(space);
  }

  async listSharedWithUser(userId: string): Promise<Array<SharedSpaceDto>> {
    const userOid = toOid(userId);
    const spaces = await this.spaceModel
      .find({ 'sharedWith.userId': userOid })
      .sort({ order: 1 });
    if (spaces.length === 0) return [];

    const spaceIds = spaces.map((s) => s._id as Types.ObjectId);
    const wsIds = Array.from(
      new Set(spaces.map((s) => s.workspaceId.toHexString())),
    ).map((s) => new Types.ObjectId(s));

    const [allLists, workspaces] = await Promise.all([
      this.listModel
        .find({ spaceId: { $in: spaceIds } })
        .sort({ order: 1 }),
      this.workspaceModel.find({ _id: { $in: wsIds } }).select({ ownerId: 1 }),
    ]);

    const ownerIds = Array.from(
      new Set(workspaces.map((w) => w.ownerId.toHexString())),
    ).map((s) => new Types.ObjectId(s));
    const owners = await this.userModel
      .find({ _id: { $in: ownerIds } })
      .select({ _id: 1, name: 1, email: 1 });

    const ownerById = new Map<string, UserDocument>();
    for (const o of owners) ownerById.set((o._id as Types.ObjectId).toHexString(), o);

    const wsOwnerById = new Map<string, Types.ObjectId>();
    for (const w of workspaces) {
      wsOwnerById.set((w._id as Types.ObjectId).toHexString(), w.ownerId);
    }

    const listsBySpace = new Map<string, Array<ListDto>>();
    for (const l of allLists) {
      const key = l.spaceId.toHexString();
      const arr = listsBySpace.get(key) ?? [];
      arr.push(new ListDto(l));
      listsBySpace.set(key, arr);
    }

    return spaces.map((space) => {
      const entry = space.sharedWith.find(
        (e) => e.userId.toHexString() === userOid.toHexString(),
      );
      const ownerOid = wsOwnerById.get(space.workspaceId.toHexString());
      const ownerDoc = ownerOid
        ? ownerById.get(ownerOid.toHexString())
        : undefined;
      return new SharedSpaceDto({
        space: new SpaceDto(space),
        lists: listsBySpace.get((space._id as Types.ObjectId).toHexString()) ?? [],
        owner: new SharedSpaceOwnerDto(ownerDoc ?? { _id: ownerOid }),
        role: entry?.role ?? ESpaceShareRole.Viewer,
      });
    });
  }

  async assertReadAccessToSpace(
    spaceId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<SpaceDocument> {
    const space = await this.spaceModel.findById(spaceId);
    if (!space) throw new NotFoundException('Space not found');

    const inWorkspace = await this.workspaceModel.exists({
      _id: space.workspaceId,
      memberIds: userId,
    });
    if (inWorkspace) return space;

    const isShared = space.sharedWith.some(
      (e) => e.userId.toHexString() === userId.toHexString(),
    );
    if (isShared) return space;

    throw new ForbiddenException('Space access denied');
  }

  async assertReadAccessToList(
    listId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ListDocument> {
    const list = await this.listModel.findById(listId);
    if (!list) throw new NotFoundException('List not found');
    await this.assertReadAccessToSpace(list.spaceId, userId);
    return list;
  }

  private async loadSpaceAsWorkspaceOwner(
    spaceId: string,
    actorId: string,
  ): Promise<SpaceDocument> {
    const space = await this.spaceModel.findById(toOid(spaceId));
    if (!space) throw new NotFoundException('Space not found');

    const ws = await this.workspaceModel.findById(space.workspaceId);
    if (!ws) throw new NotFoundException('Workspace not found');
    if (ws.ownerId.toHexString() !== actorId) {
      throw new ForbiddenException('Only the workspace owner can share spaces');
    }
    return space;
  }
}
