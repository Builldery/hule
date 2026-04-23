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

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class TaskService {
  @InjectModel(Task.name) private taskModel: Model<TaskDocument>;
  @InjectModel(Comment.name) private commentModel: Model<Comment>;
  @InjectModel(List.name) private listModel: Model<List>;

  async getByListQuery(query: TasksListQueryDto): Promise<Array<TaskDto>> {
    const listOid = toOid(query.listId);
    const filter: Record<string, unknown> = { listId: listOid };
    if ((query.includeSubtasks ?? EIncludeSubtasks.False) === EIncludeSubtasks.False) {
      filter.parentId = null;
    }
    const docs = await this.taskModel.find(filter).sort({ order: 1 });
    return (docs ?? []).map((d) => new TaskDto(d));
  }

  async timeline(query: TimelineQueryDto): Promise<Array<TaskDto>> {
    const filter: Record<string, unknown> = {
      startDate: { $exists: true, $ne: null },
      dueDate: { $exists: true, $ne: null },
    };
    if (query.listId) {
      filter.listId = toOid(query.listId);
    } else if (query.spaceId) {
      const listIds = await this.listModel
        .find({ spaceId: toOid(query.spaceId) })
        .select({ _id: 1 });
      filter.listId = { $in: listIds.map((l) => l._id) };
    }
    if (query.from || query.to) {
      filter.$and = [
        { startDate: { $lt: query.to ? new Date(query.to) : new Date('2999-01-01') } },
        { dueDate: { $gt: query.from ? new Date(query.from) : new Date('1970-01-01') } },
      ];
    }
    const docs = await this.taskModel.find(filter).sort({ startDate: 1 });
    return (docs ?? []).map((d) => new TaskDto(d));
  }

  async getById(id: string): Promise<TaskDto> {
    const doc = await this.taskModel.findById(toOid(id));
    if (!doc) throw new NotFoundException('Task not found');
    return new TaskDto(doc);
  }

  async getSubtree(id: string): Promise<Array<TaskDto>> {
    const oid = toOid(id);
    const root = await this.taskModel.findById(oid);
    if (!root) throw new NotFoundException('Task not found');
    const descendants = await this.taskModel.find({ path: oid }).sort({ depth: 1, order: 1 });
    return [root, ...(descendants ?? [])].map((d) => new TaskDto(d));
  }

  async create(dto: CreateTaskDto): Promise<TaskDto> {
    const listOid = toOid(dto.listId);
    const list = await this.listModel.findById(listOid);
    if (!list) throw new BadRequestException('List not found');

    let parentOid: Types.ObjectId | null = null;
    let depth = 0;
    let path: Array<Types.ObjectId> = [];
    if (dto.parentId) {
      parentOid = toOid(dto.parentId);
      const parent = await this.taskModel.findById(parentOid);
      if (!parent) throw new BadRequestException('Parent task not found');
      depth = parent.depth + 1;
      path = [...parent.path, parent._id as Types.ObjectId];
    }

    const lastByOrder = await this.taskModel
      .findOne({ listId: listOid, parentId: parentOid })
      .sort({ order: -1 });
    const order = (lastByOrder?.order ?? -1) + 1;

    const doc = await this.taskModel.create({
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
    });
    return new TaskDto(doc);
  }

  async update(id: string, patch: UpdateTaskDto): Promise<TaskDto> {
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, ''> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) $unset[k] = '';
      else if (v !== undefined) {
        if (k === 'startDate' || k === 'dueDate') $set[k] = new Date(v as string);
        else $set[k] = v;
      }
    }
    const update: mongoose.UpdateQuery<TaskDocument> = { $set };
    if (Object.keys($unset).length) update.$unset = $unset;

    const doc = await this.taskModel.findByIdAndUpdate(toOid(id), update, {
      new: true,
    });
    if (!doc) throw new NotFoundException('Task not found');
    return new TaskDto(doc);
  }

  async move(id: string, body: MoveTaskDto): Promise<void> {
    const oid = toOid(id);
    const task = await this.taskModel.findById(oid);
    if (!task) throw new NotFoundException('Task not found');

    let nextListOid = task.listId;
    let nextParentOid: Types.ObjectId | null = task.parentId;
    let nextPath: Array<Types.ObjectId> = task.path;
    let nextDepth = task.depth;

    const parentChanged = body.parentId !== undefined;
    const listChanged =
      body.listId !== undefined &&
      toOid(body.listId).toHexString() !== (task.listId as Types.ObjectId).toHexString();

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
        const parent = await this.taskModel.findById(parentOid);
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
      nextListOid = toOid(body.listId!);
      nextParentOid = null;
      nextPath = [];
      nextDepth = 0;
    } else if (listChanged && body.parentId === null) {
      nextListOid = toOid(body.listId!);
    }

    const now = new Date();
    await this.taskModel.updateOne(
      { _id: oid },
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
      const descendants = await this.taskModel.find({ path: oid });
      if (descendants.length > 0) {
        const ops = descendants.map((d) => {
          const idxOfSelf = d.path.findIndex((p) => p.toHexString() === oid.toHexString());
          const suffix = d.path.slice(idxOfSelf);
          const newPath = [...nextPath, ...suffix];
          const newDepth = newPath.length;
          return {
            updateOne: {
              filter: { _id: d._id },
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

  async delete(id: string): Promise<void> {
    const oid = toOid(id);
    await this.taskModel.deleteMany({ $or: [{ _id: oid }, { path: oid }] });
    await this.commentModel.deleteMany({ taskId: oid });
  }

  async deleteByListIds(listIds: Array<Types.ObjectId>): Promise<void> {
    if (!listIds.length) return;
    const tasks = await this.taskModel
      .find({ listId: { $in: listIds } })
      .select({ _id: 1 });
    const taskIds = tasks.map((t) => t._id);
    await this.taskModel.deleteMany({ listId: { $in: listIds } });
    if (taskIds.length) {
      await this.commentModel.deleteMany({ taskId: { $in: taskIds } });
    }
  }
}
