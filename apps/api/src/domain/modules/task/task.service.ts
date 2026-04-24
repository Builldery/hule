import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../../../adapters/mongo/task.schema';
import { Comment } from '../../../adapters/mongo/comment.schema';
import { List } from '../../../adapters/mongo/list.schema';
import { Workspace } from '../../../adapters/mongo/workspace.schema';
import { TaskDto } from '../../entity/task/task.dto';
import { CreateTaskDto } from '../../entity/task/create-task.dto';
import { UpdateTaskDto } from '../../entity/task/update-task.dto';
import { MoveTaskDto } from '../../entity/task/move-task.dto';
import {
  EIncludeSubtasks,
  TasksListQueryDto,
} from '../../entity/task/tasks-list-query.dto';
import { TimelineQueryDto } from '../../entity/task/timeline-query.dto';
import { ETaskPriority } from '../../entity/task/task.constants';
import { TagService } from '../tag/tag.service';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class TaskService {
  @InjectModel(Task.name) private taskModel: Model<TaskDocument>;
  @InjectModel(Comment.name) private commentModel: Model<Comment>;
  @InjectModel(List.name) private listModel: Model<List>;
  @InjectModel(Workspace.name) private workspaceModel: Model<Workspace>;

  constructor(private readonly tagService: TagService) {}

  async getByListQuery(
    wsId: string,
    query: TasksListQueryDto,
  ): Promise<Array<TaskDto>> {
    const wsOid = toOid(wsId);
    const listOid = toOid(query.listId);
    const filter: Record<string, unknown> = {
      workspaceId: wsOid,
      listId: listOid,
    };
    if (
      (query.includeSubtasks ?? EIncludeSubtasks.False) === EIncludeSubtasks.False
    ) {
      filter.parentId = null;
    }
    const docs = await this.taskModel.find(filter).sort({ order: 1 });
    return (docs ?? []).map((d) => new TaskDto(d));
  }

  async timeline(wsId: string, query: TimelineQueryDto): Promise<Array<TaskDto>> {
    const wsOid = toOid(wsId);
    const filter: Record<string, unknown> = {
      workspaceId: wsOid,
      startDate: { $exists: true, $ne: null },
      dueDate: { $exists: true, $ne: null },
    };
    if (query.listId) {
      filter.listId = toOid(query.listId);
    } else if (query.spaceId) {
      const listIds = await this.listModel
        .find({ workspaceId: wsOid, spaceId: toOid(query.spaceId) })
        .select({ _id: 1 });
      filter.listId = { $in: listIds.map((l) => l._id) };
    }
    if (query.from || query.to) {
      filter.$and = [
        {
          startDate: {
            $lt: query.to ? new Date(query.to) : new Date('2999-01-01'),
          },
        },
        {
          dueDate: {
            $gt: query.from ? new Date(query.from) : new Date('1970-01-01'),
          },
        },
      ];
    }
    const docs = await this.taskModel.find(filter).sort({ startDate: 1 });
    return (docs ?? []).map((d) => new TaskDto(d));
  }

  async getById(wsId: string, id: string): Promise<TaskDto> {
    const doc = await this.taskModel.findOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
    });
    if (!doc) throw new NotFoundException('Task not found');
    return new TaskDto(doc);
  }

  async getSubtree(wsId: string, id: string): Promise<Array<TaskDto>> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const root = await this.taskModel.findOne({ _id: oid, workspaceId: wsOid });
    if (!root) throw new NotFoundException('Task not found');
    const descendants = await this.taskModel
      .find({ workspaceId: wsOid, path: oid })
      .sort({ depth: 1, order: 1 });
    return [root, ...(descendants ?? [])].map((d) => new TaskDto(d));
  }

  async create(wsId: string, dto: CreateTaskDto): Promise<TaskDto> {
    const wsOid = toOid(wsId);
    const listOid = toOid(dto.listId);
    const list = await this.listModel.findOne({
      _id: listOid,
      workspaceId: wsOid,
    });
    if (!list) throw new BadRequestException('List not found');

    let parentOid: Types.ObjectId | null = null;
    let depth = 0;
    let path: Array<Types.ObjectId> = [];
    if (dto.parentId) {
      parentOid = toOid(dto.parentId);
      const parent = await this.taskModel.findOne({
        _id: parentOid,
        workspaceId: wsOid,
      });
      if (!parent) throw new BadRequestException('Parent task not found');
      depth = parent.depth + 1;
      path = [...parent.path, parent._id as Types.ObjectId];
    }

    if (dto.assigneeId) {
      await this.assertAssigneeMember(wsOid, toOid(dto.assigneeId));
    }

    const tagOids = (dto.tagIds ?? []).map(toOid);
    if (tagOids.length) {
      await this.tagService.assertTagsInWorkspace(wsOid, tagOids);
    }

    const lastByOrder = await this.taskModel
      .findOne({ workspaceId: wsOid, listId: listOid, parentId: parentOid })
      .sort({ order: -1 });
    const order = (lastByOrder?.order ?? -1) + 1;

    const doc = await this.taskModel.create({
      workspaceId: wsOid,
      listId: listOid,
      parentId: parentOid,
      title: dto.title,
      description: dto.description,
      status: dto.status ?? 'todo',
      priority: dto.priority ?? ETaskPriority.None,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      order,
      depth,
      path,
      assigneeId: dto.assigneeId ? toOid(dto.assigneeId) : null,
      tagIds: tagOids,
      timeEstimate: dto.timeEstimate,
      trackedTime: dto.trackedTime,
    });
    return new TaskDto(doc);
  }

  async update(
    wsId: string,
    id: string,
    patch: UpdateTaskDto,
  ): Promise<TaskDto> {
    const wsOid = toOid(wsId);
    if (patch.assigneeId !== undefined && patch.assigneeId !== null) {
      await this.assertAssigneeMember(wsOid, toOid(patch.assigneeId));
    }
    const tagOids = Array.isArray(patch.tagIds)
      ? patch.tagIds.map(toOid)
      : undefined;
    if (tagOids && tagOids.length) {
      await this.tagService.assertTagsInWorkspace(wsOid, tagOids);
    }
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, ''> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) {
        if (k === 'assigneeId') $set[k] = null;
        else $unset[k] = '';
      } else if (v !== undefined) {
        if (k === 'startDate' || k === 'dueDate') $set[k] = new Date(v as string);
        else if (k === 'assigneeId') $set[k] = toOid(v as string);
        else if (k === 'tagIds') $set[k] = tagOids;
        else $set[k] = v;
      }
    }
    const update: mongoose.UpdateQuery<TaskDocument> = { $set };
    if (Object.keys($unset).length) update.$unset = $unset;

    const doc = await this.taskModel.findOneAndUpdate(
      { _id: toOid(id), workspaceId: wsOid },
      update,
      { new: true },
    );
    if (!doc) throw new NotFoundException('Task not found');
    return new TaskDto(doc);
  }

  async move(wsId: string, id: string, body: MoveTaskDto): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const task = await this.taskModel.findOne({ _id: oid, workspaceId: wsOid });
    if (!task) throw new NotFoundException('Task not found');

    let nextListOid = task.listId;
    let nextParentOid: Types.ObjectId | null = task.parentId;
    let nextPath: Array<Types.ObjectId> = task.path;
    let nextDepth = task.depth;

    const parentChanged = body.parentId !== undefined;
    const listChanged =
      body.listId !== undefined &&
      toOid(body.listId).toHexString() !==
        (task.listId as Types.ObjectId).toHexString();

    if (parentChanged) {
      if (body.parentId === null) {
        nextParentOid = null;
        nextPath = [];
        nextDepth = 0;
      } else {
        const parentOid = toOid(body.parentId!);
        if (parentOid.toHexString() === oid.toHexString()) {
          throw new BadRequestException('Task cannot be its own parent');
        }
        const parent = await this.taskModel.findOne({
          _id: parentOid,
          workspaceId: wsOid,
        });
        if (!parent) throw new BadRequestException('Parent not found');
        if (parent.path.some((p) => p.toHexString() === oid.toHexString())) {
          throw new BadRequestException('Cannot move task under its own descendant');
        }
        nextParentOid = parentOid;
        nextPath = [...parent.path, parent._id as Types.ObjectId];
        nextDepth = parent.depth + 1;
        nextListOid = parent.listId;
      }
    }
    if (listChanged && !parentChanged) {
      const targetList = await this.listModel.findOne({
        _id: toOid(body.listId!),
        workspaceId: wsOid,
      });
      if (!targetList) throw new BadRequestException('List not found');
      nextListOid = toOid(body.listId!);
      nextParentOid = null;
      nextPath = [];
      nextDepth = 0;
    } else if (listChanged && body.parentId === null) {
      const targetList = await this.listModel.findOne({
        _id: toOid(body.listId!),
        workspaceId: wsOid,
      });
      if (!targetList) throw new BadRequestException('List not found');
      nextListOid = toOid(body.listId!);
    }

    const now = new Date();
    await this.taskModel.updateOne(
      { _id: oid, workspaceId: wsOid },
      {
        $set: {
          listId: nextListOid,
          parentId: nextParentOid,
          path: nextPath,
          depth: nextDepth,
          order: body.order,
          updatedAt: now,
        },
      },
    );

    const pathChangedFromOriginal =
      nextPath.length !== task.path.length ||
      nextPath.some((p, i) => p.toHexString() !== task.path[i]?.toHexString()) ||
      nextListOid.toHexString() !== (task.listId as Types.ObjectId).toHexString();

    if (pathChangedFromOriginal) {
      const descendants = await this.taskModel.find({
        workspaceId: wsOid,
        path: oid,
      });
      if (descendants.length > 0) {
        const ops = descendants.map((d) => {
          const idxOfSelf = d.path.findIndex(
            (p) => p.toHexString() === oid.toHexString(),
          );
          const suffix = d.path.slice(idxOfSelf);
          const newPath = [...nextPath, ...suffix];
          const newDepth = newPath.length;
          return {
            updateOne: {
              filter: { _id: d._id, workspaceId: wsOid },
              update: {
                $set: {
                  path: newPath,
                  depth: newDepth,
                  listId: nextListOid,
                  updatedAt: now,
                },
              },
            },
          };
        });
        await this.taskModel.bulkWrite(ops as any);
      }
    }
  }

  async delete(wsId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const existed = await this.taskModel.findOne({ _id: oid, workspaceId: wsOid });
    if (!existed) throw new NotFoundException('Task not found');
    await this.taskModel.deleteMany({
      workspaceId: wsOid,
      $or: [{ _id: oid }, { path: oid }],
    });
    const taskIds = [oid];
    await this.commentModel.deleteMany({
      workspaceId: wsOid,
      $or: [{ taskId: { $in: taskIds } }, { taskId: oid }],
    });
  }

  async deleteByListIds(
    wsOid: Types.ObjectId,
    listIds: Array<Types.ObjectId>,
  ): Promise<void> {
    if (!listIds.length) return;
    const tasks = await this.taskModel
      .find({ workspaceId: wsOid, listId: { $in: listIds } })
      .select({ _id: 1 });
    const taskIds = tasks.map((t) => t._id);
    await this.taskModel.deleteMany({
      workspaceId: wsOid,
      listId: { $in: listIds },
    });
    if (taskIds.length) {
      await this.commentModel.deleteMany({
        workspaceId: wsOid,
        taskId: { $in: taskIds },
      });
    }
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.commentModel.deleteMany({ workspaceId: wsOid });
    await this.taskModel.deleteMany({ workspaceId: wsOid });
  }

  private async assertAssigneeMember(
    wsOid: Types.ObjectId,
    assigneeOid: Types.ObjectId,
  ): Promise<void> {
    const exists = await this.workspaceModel.exists({
      _id: wsOid,
      memberIds: assigneeOid,
    });
    if (!exists) {
      throw new BadRequestException('Assignee is not a workspace member');
    }
  }
}
