import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import {
  RecurringJob,
  RecurringJobDocument,
} from '../../../adapters/mongo/recurring-job.schema';
import {
  TaskTemplate,
  TaskTemplateDocument,
} from '../../../adapters/mongo/task-template.schema';
import { List } from '../../../adapters/mongo/list.schema';
import { CreateRecurringTaskDto } from '../../entity/recurring-job/create-recurring-task.dto';
import { UpdateRecurringTaskDto } from '../../entity/recurring-job/update-recurring-task.dto';
import { RecurringTaskDto } from '../../entity/recurring-job/recurring-task.dto';
import { RecurrenceScheduleDto } from '../../entity/recurring-job/recurrence-schedule.dto';
import { ETaskPriority } from '../../entity/task/task.constants';
import { TagService } from '../tag/tag.service';
import { TaskCopyService } from '../task-copy/task-copy.service';
import {
  computeNextRunAt,
  localEndOfDay,
  localStartOfDay,
  ScheduleSpec,
} from './schedule-clock';
import { toOid } from '../../entity/common/to-oid';

@Injectable()
export class RecurringJobService {
  private readonly logger = new Logger(RecurringJobService.name);

  @InjectModel(RecurringJob.name)
  private jobModel: Model<RecurringJobDocument>;
  @InjectModel(TaskTemplate.name)
  private templateModel: Model<TaskTemplateDocument>;
  @InjectModel(List.name) private listModel: Model<List>;

  constructor(
    private readonly tagService: TagService,
    private readonly taskCopyService: TaskCopyService,
  ) {}

  async list(wsId: string): Promise<Array<RecurringTaskDto>> {
    const wsOid = toOid(wsId);
    const jobs = await this.jobModel.find({ workspaceId: wsOid }).sort({ createdAt: -1 });
    if (!jobs.length) return [];
    const templateIds = jobs.map((j) => j.templateId);
    const templates = await this.templateModel.find({
      _id: { $in: templateIds },
      workspaceId: wsOid,
    });
    const templateById = new Map(
      templates.map((t) => [(t._id as Types.ObjectId).toHexString(), t]),
    );
    return jobs.map(
      (j) =>
        new RecurringTaskDto(j, templateById.get(j.templateId.toHexString())),
    );
  }

  async getById(wsId: string, id: string): Promise<RecurringTaskDto> {
    const wsOid = toOid(wsId);
    const job = await this.jobModel.findOne({
      _id: toOid(id),
      workspaceId: wsOid,
    });
    if (!job) throw new NotFoundException('Recurring task not found');
    const template = await this.templateModel.findOne({
      _id: job.templateId,
      workspaceId: wsOid,
    });
    return new RecurringTaskDto(job, template);
  }

  async create(
    wsId: string,
    dto: CreateRecurringTaskDto,
  ): Promise<RecurringTaskDto> {
    const wsOid = toOid(wsId);
    const listOid = toOid(dto.targetListId);
    const list = await this.listModel.findOne({
      _id: listOid,
      workspaceId: wsOid,
    });
    if (!list) throw new BadRequestException('Target list not found');

    const tagOids = (dto.template.tagIds ?? []).map(toOid);
    if (tagOids.length) {
      await this.tagService.assertTagsInWorkspace(wsOid, tagOids);
    }

    const lastByOrder = await this.templateModel
      .findOne({ workspaceId: wsOid, spaceId: list.spaceId, parentId: null })
      .sort({ order: -1 });
    const order = (lastByOrder?.order ?? -1) + 1;

    const template = await this.templateModel.create({
      workspaceId: wsOid,
      spaceId: list.spaceId,
      parentId: null,
      title: dto.template.title,
      description: dto.template.description,
      priority: dto.template.priority ?? ETaskPriority.None,
      order,
      depth: 0,
      path: [],
      tagIds: tagOids,
      timeEstimate: dto.template.timeEstimate,
    });

    const nextRunAt = computeNextRunAt(dto.schedule, new Date());
    const job = await this.jobModel.create({
      workspaceId: wsOid,
      spaceId: list.spaceId,
      templateId: template._id as Types.ObjectId,
      targetListId: listOid,
      name: dto.name,
      kind: dto.schedule.kind,
      timeOfDay: dto.schedule.timeOfDay,
      weekday: dto.schedule.weekday,
      monthDay: dto.schedule.monthDay,
      monthOfYear: dto.schedule.monthOfYear,
      active: true,
      nextRunAt,
      lastRunAt: null,
      lastSpawnedTaskId: null,
    });

    return new RecurringTaskDto(job, template);
  }

  async update(
    wsId: string,
    id: string,
    dto: UpdateRecurringTaskDto,
  ): Promise<RecurringTaskDto> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const job = await this.jobModel.findOne({ _id: oid, workspaceId: wsOid });
    if (!job) throw new NotFoundException('Recurring task not found');

    const jobSet: Record<string, unknown> = {};
    if (dto.name !== undefined) jobSet.name = dto.name;
    if (dto.active !== undefined) jobSet.active = dto.active;
    if (dto.targetListId !== undefined) {
      const list = await this.listModel.findOne({
        _id: toOid(dto.targetListId),
        workspaceId: wsOid,
      });
      if (!list) throw new BadRequestException('Target list not found');
      jobSet.targetListId = list._id;
      jobSet.spaceId = list.spaceId;
    }
    if (dto.schedule) {
      jobSet.kind = dto.schedule.kind;
      jobSet.timeOfDay = dto.schedule.timeOfDay;
      jobSet.weekday = dto.schedule.weekday;
      jobSet.monthDay = dto.schedule.monthDay;
      jobSet.monthOfYear = dto.schedule.monthOfYear;
      jobSet.nextRunAt = computeNextRunAt(dto.schedule, new Date());
    }
    if (Object.keys(jobSet).length) {
      await this.jobModel.updateOne(
        { _id: oid, workspaceId: wsOid },
        { $set: jobSet },
      );
    }

    if (dto.template) {
      const tagOids = Array.isArray(dto.template.tagIds)
        ? dto.template.tagIds.map(toOid)
        : undefined;
      if (tagOids && tagOids.length) {
        await this.tagService.assertTagsInWorkspace(wsOid, tagOids);
      }
      const $set: Record<string, unknown> = {};
      const $unset: Record<string, ''> = {};
      for (const [k, v] of Object.entries(dto.template)) {
        if (v === null) {
          $unset[k] = '';
        } else if (v !== undefined) {
          if (k === 'tagIds') $set[k] = tagOids;
          else $set[k] = v;
        }
      }
      const update: mongoose.UpdateQuery<TaskTemplateDocument> = { $set };
      if (Object.keys($unset).length) update.$unset = $unset;
      await this.templateModel.updateOne(
        { _id: job.templateId, workspaceId: wsOid },
        update,
      );
    }

    return this.getById(wsId, id);
  }

  async delete(wsId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const job = await this.jobModel.findOne({ _id: oid, workspaceId: wsOid });
    if (!job) throw new NotFoundException('Recurring task not found');
    await this.jobModel.deleteOne({ _id: oid, workspaceId: wsOid });
    await this.templateModel.deleteMany({
      workspaceId: wsOid,
      $or: [{ _id: job.templateId }, { path: job.templateId }],
    });
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.jobModel.deleteMany({ workspaceId: wsOid });
  }

  async deleteBySpaceId(
    wsOid: Types.ObjectId,
    spaceOid: Types.ObjectId,
  ): Promise<void> {
    await this.jobModel.deleteMany({
      workspaceId: wsOid,
      spaceId: spaceOid,
    });
  }

  async existsForTemplate(
    wsOid: Types.ObjectId,
    templateOid: Types.ObjectId,
  ): Promise<boolean> {
    const exists = await this.jobModel.exists({
      workspaceId: wsOid,
      templateId: templateOid,
    });
    return !!exists;
  }

  async tickDue(now: Date = new Date()): Promise<number> {
    let spawned = 0;
    while (true) {
      const job = await this.claimNextDue(now);
      if (!job) break;
      try {
        await this.spawnInstance(job, now);
        spawned += 1;
      } catch (err) {
        this.logger.error(
          `Failed to spawn recurring task ${job._id}: ${(err as Error).message}`,
          (err as Error).stack,
        );
      }
    }
    return spawned;
  }

  private async claimNextDue(now: Date): Promise<RecurringJobDocument | null> {
    const due = await this.jobModel.findOne({
      active: true,
      nextRunAt: { $lte: now },
    });
    if (!due) return null;
    const spec: ScheduleSpec = {
      kind: due.kind,
      timeOfDay: due.timeOfDay,
      weekday: due.weekday,
      monthDay: due.monthDay,
      monthOfYear: due.monthOfYear,
    };
    const nextRunAt = computeNextRunAt(spec, now);
    const claimed = await this.jobModel.findOneAndUpdate(
      { _id: due._id, nextRunAt: due.nextRunAt, active: true },
      { $set: { nextRunAt, lastRunAt: now } },
      { new: true },
    );
    return claimed;
  }

  private async spawnInstance(
    job: RecurringJobDocument,
    now: Date,
  ): Promise<void> {
    const startDate = localStartOfDay(now);
    const dueDate = localEndOfDay(now);
    const result = await this.taskCopyService
      .builder()
      .fromTemplate(job.templateId)
      .inWorkspace(job.workspaceId)
      .toList(job.targetListId)
      .asChildOf(null)
      .withSubtasks()
      .withoutComments()
      .resetStatus('todo')
      .setDates({ startDate, dueDate })
      .execute();
    await this.jobModel.updateOne(
      { _id: job._id },
      { $set: { lastSpawnedTaskId: toOid(result.id) } },
    );
  }
}
