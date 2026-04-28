import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import {
  TaskTemplate,
  TaskTemplateDocument,
} from '../../../adapters/mongo/task-template.schema';
import { Space } from '../../../adapters/mongo/space.schema';
import { RecurringJob } from '../../../adapters/mongo/recurring-job.schema';
import { Action } from '../../../adapters/mongo/action.schema';
import { TaskDto } from '../../entity/task/task.dto';
import { SpawnFromTemplateDto } from '../../entity/task-template/spawn-from-template.dto';
import { TaskCopyService } from '../task-copy/task-copy.service';
import { TaskTemplateDto } from '../../entity/task-template/task-template.dto';
import { CreateTaskTemplateDto } from '../../entity/task-template/create-task-template.dto';
import { UpdateTaskTemplateDto } from '../../entity/task-template/update-task-template.dto';
import { MoveTaskTemplateDto } from '../../entity/task-template/move-task-template.dto';
import { TaskTemplatesListQueryDto } from '../../entity/task-template/task-templates-list-query.dto';
import { EIncludeSubtasks } from '../../entity/task/tasks-list-query.dto';
import { ETaskPriority } from '../../entity/task/task.constants';
import { TagService } from '../tag/tag.service';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class TaskTemplateService {
  @InjectModel(TaskTemplate.name)
  private templateModel: Model<TaskTemplateDocument>;
  @InjectModel(Space.name) private spaceModel: Model<Space>;
  @InjectModel(RecurringJob.name) private recurringJobModel: Model<RecurringJob>;
  @InjectModel(Action.name) private actionModel: Model<Action>;

  constructor(
    private readonly tagService: TagService,
    private readonly taskCopyService: TaskCopyService,
  ) {}

  async spawnAsTask(
    wsId: string,
    templateId: string,
    dto: SpawnFromTemplateDto,
  ): Promise<TaskDto> {
    const wsOid = toOid(wsId);
    const tplOid = toOid(templateId);
    const tpl = await this.templateModel.findOne({
      _id: tplOid,
      workspaceId: wsOid,
    });
    if (!tpl) throw new NotFoundException('Task template not found');

    const builder = this.taskCopyService
      .builder()
      .fromTemplate(tplOid)
      .inWorkspace(wsOid)
      .toList(toOid(dto.listId))
      .asChildOf(null)
      .withSubtasks()
      .withoutComments()
      .resetStatus('todo');

    const setDates: { startDate?: Date; dueDate?: Date } = {};
    if (dto.startDate) setDates.startDate = new Date(dto.startDate);
    if (dto.dueDate) setDates.dueDate = new Date(dto.dueDate);
    if (Object.keys(setDates).length) builder.setDates(setDates);

    return builder.execute();
  }

  async getBySpaceQuery(
    wsId: string,
    query: TaskTemplatesListQueryDto,
  ): Promise<Array<TaskTemplateDto>> {
    const wsOid = toOid(wsId);
    const spaceOid = toOid(query.spaceId);
    const filter: Record<string, unknown> = {
      workspaceId: wsOid,
      spaceId: spaceOid,
    };
    if (
      (query.includeSubtasks ?? EIncludeSubtasks.False) === EIncludeSubtasks.False
    ) {
      filter.parentId = null;
    }
    const docs = await this.templateModel.find(filter).sort({ order: 1 });
    return (docs ?? []).map((d) => new TaskTemplateDto(d));
  }

  async getById(wsId: string, id: string): Promise<TaskTemplateDto> {
    const doc = await this.templateModel.findOne({
      _id: toOid(id),
      workspaceId: toOid(wsId),
    });
    if (!doc) throw new NotFoundException('Task template not found');
    return new TaskTemplateDto(doc);
  }

  async getSubtree(
    wsId: string,
    id: string,
  ): Promise<Array<TaskTemplateDto>> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const root = await this.templateModel.findOne({
      _id: oid,
      workspaceId: wsOid,
    });
    if (!root) throw new NotFoundException('Task template not found');
    const descendants = await this.templateModel
      .find({ workspaceId: wsOid, path: oid })
      .sort({ depth: 1, order: 1 });
    return [root, ...(descendants ?? [])].map((d) => new TaskTemplateDto(d));
  }

  async create(
    wsId: string,
    dto: CreateTaskTemplateDto,
  ): Promise<TaskTemplateDto> {
    const wsOid = toOid(wsId);
    const spaceOid = toOid(dto.spaceId);
    const space = await this.spaceModel.findOne({
      _id: spaceOid,
      workspaceId: wsOid,
    });
    if (!space) throw new BadRequestException('Space not found');

    let parentOid: Types.ObjectId | null = null;
    let depth = 0;
    let path: Array<Types.ObjectId> = [];
    if (dto.parentId) {
      parentOid = toOid(dto.parentId);
      const parent = await this.templateModel.findOne({
        _id: parentOid,
        workspaceId: wsOid,
      });
      if (!parent) throw new BadRequestException('Parent template not found');
      if (parent.spaceId.toHexString() !== spaceOid.toHexString()) {
        throw new BadRequestException('Parent template lives in another space');
      }
      depth = parent.depth + 1;
      path = [...parent.path, parent._id as Types.ObjectId];
    }

    const tagOids = (dto.tagIds ?? []).map(toOid);
    if (tagOids.length) {
      await this.tagService.assertTagsInWorkspace(wsOid, tagOids);
    }

    const lastByOrder = await this.templateModel
      .findOne({ workspaceId: wsOid, spaceId: spaceOid, parentId: parentOid })
      .sort({ order: -1 });
    const order = (lastByOrder?.order ?? -1) + 1;

    const doc = await this.templateModel.create({
      workspaceId: wsOid,
      spaceId: spaceOid,
      parentId: parentOid,
      title: dto.title,
      description: dto.description,
      priority: dto.priority ?? ETaskPriority.None,
      order,
      depth,
      path,
      tagIds: tagOids,
      timeEstimate: dto.timeEstimate,
    });
    return new TaskTemplateDto(doc);
  }

  async update(
    wsId: string,
    id: string,
    patch: UpdateTaskTemplateDto,
  ): Promise<TaskTemplateDto> {
    const wsOid = toOid(wsId);
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
        $unset[k] = '';
      } else if (v !== undefined) {
        if (k === 'tagIds') $set[k] = tagOids;
        else $set[k] = v;
      }
    }
    const update: mongoose.UpdateQuery<TaskTemplateDocument> = { $set };
    if (Object.keys($unset).length) update.$unset = $unset;

    const doc = await this.templateModel.findOneAndUpdate(
      { _id: toOid(id), workspaceId: wsOid },
      update,
      { new: true },
    );
    if (!doc) throw new NotFoundException('Task template not found');
    return new TaskTemplateDto(doc);
  }

  async move(
    wsId: string,
    id: string,
    body: MoveTaskTemplateDto,
  ): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const tpl = await this.templateModel.findOne({
      _id: oid,
      workspaceId: wsOid,
    });
    if (!tpl) throw new NotFoundException('Task template not found');

    let nextSpaceOid = tpl.spaceId;
    let nextParentOid: Types.ObjectId | null = tpl.parentId;
    let nextPath: Array<Types.ObjectId> = tpl.path;
    let nextDepth = tpl.depth;

    const parentChanged = body.parentId !== undefined;
    const spaceChanged =
      body.spaceId !== undefined &&
      toOid(body.spaceId).toHexString() !==
        (tpl.spaceId as Types.ObjectId).toHexString();

    if (parentChanged) {
      if (body.parentId === null) {
        nextParentOid = null;
        nextPath = [];
        nextDepth = 0;
      } else {
        const parentOid = toOid(body.parentId!);
        if (parentOid.toHexString() === oid.toHexString()) {
          throw new BadRequestException('Template cannot be its own parent');
        }
        const parent = await this.templateModel.findOne({
          _id: parentOid,
          workspaceId: wsOid,
        });
        if (!parent) throw new BadRequestException('Parent template not found');
        if (parent.path.some((p) => p.toHexString() === oid.toHexString())) {
          throw new BadRequestException(
            'Cannot move template under its own descendant',
          );
        }
        nextParentOid = parentOid;
        nextPath = [...parent.path, parent._id as Types.ObjectId];
        nextDepth = parent.depth + 1;
        nextSpaceOid = parent.spaceId;
      }
    }
    if (spaceChanged && !parentChanged) {
      const targetSpace = await this.spaceModel.findOne({
        _id: toOid(body.spaceId!),
        workspaceId: wsOid,
      });
      if (!targetSpace) throw new BadRequestException('Space not found');
      nextSpaceOid = toOid(body.spaceId!);
      nextParentOid = null;
      nextPath = [];
      nextDepth = 0;
    } else if (spaceChanged && body.parentId === null) {
      const targetSpace = await this.spaceModel.findOne({
        _id: toOid(body.spaceId!),
        workspaceId: wsOid,
      });
      if (!targetSpace) throw new BadRequestException('Space not found');
      nextSpaceOid = toOid(body.spaceId!);
    }

    const now = new Date();
    await this.templateModel.updateOne(
      { _id: oid, workspaceId: wsOid },
      {
        $set: {
          spaceId: nextSpaceOid,
          parentId: nextParentOid,
          path: nextPath,
          depth: nextDepth,
          order: body.order,
          updatedAt: now,
        },
      },
    );

    const pathChangedFromOriginal =
      nextPath.length !== tpl.path.length ||
      nextPath.some((p, i) => p.toHexString() !== tpl.path[i]?.toHexString()) ||
      nextSpaceOid.toHexString() !== (tpl.spaceId as Types.ObjectId).toHexString();

    if (pathChangedFromOriginal) {
      const descendants = await this.templateModel.find({
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
                  spaceId: nextSpaceOid,
                  updatedAt: now,
                },
              },
            },
          };
        });
        await this.templateModel.bulkWrite(ops as any);
      }
    }
  }

  async delete(wsId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const existed = await this.templateModel.findOne({
      _id: oid,
      workspaceId: wsOid,
    });
    if (!existed) throw new NotFoundException('Task template not found');

    const subtreeIds = await this.templateModel
      .find({ workspaceId: wsOid, $or: [{ _id: oid }, { path: oid }] })
      .select({ _id: 1 });
    const refIds = subtreeIds.map((d) => d._id as Types.ObjectId);
    const linkedJob = await this.recurringJobModel.exists({
      workspaceId: wsOid,
      templateId: { $in: refIds },
    });
    if (linkedJob) {
      throw new BadRequestException(
        'Template is in use by a recurring task — delete the recurring task first',
      );
    }
    const linkedAction = await this.actionModel.exists({
      workspaceId: wsOid,
      'triggerScope.templateId': { $in: refIds },
    });
    if (linkedAction) {
      throw new BadRequestException(
        'Template is referenced by an action — delete the action first',
      );
    }

    await this.templateModel.deleteMany({
      workspaceId: wsOid,
      $or: [{ _id: oid }, { path: oid }],
    });
  }

  async deleteBySpaceId(
    wsOid: Types.ObjectId,
    spaceOid: Types.ObjectId,
  ): Promise<void> {
    await this.templateModel.deleteMany({
      workspaceId: wsOid,
      spaceId: spaceOid,
    });
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.templateModel.deleteMany({ workspaceId: wsOid });
  }
}
