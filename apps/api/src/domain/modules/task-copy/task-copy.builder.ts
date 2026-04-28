import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TaskCopyService } from './task-copy.service';
import { CopyOptions } from './task-copy.types';
import { TaskDto } from '../../entity/task/task.dto';

type Id = string | Types.ObjectId;

function toOid(id: Id): Types.ObjectId {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

type SourceKind = 'task' | 'template';

export class TaskCopyBuilder {
  private sourceId?: Types.ObjectId;
  private sourceKind: SourceKind = 'task';
  private opts: Partial<CopyOptions> = {
    withSubtasks: true,
    withComments: false,
    resetTrackedTime: true,
    resetAssignee: false,
  };

  constructor(private readonly service: TaskCopyService) {}

  fromTask(id: Id): this {
    this.sourceId = toOid(id);
    this.sourceKind = 'task';
    return this;
  }

  fromTemplate(id: Id): this {
    this.sourceId = toOid(id);
    this.sourceKind = 'template';
    this.opts.spawnedFromTemplateRootId = this.sourceId;
    return this;
  }

  inWorkspace(id: Id): this {
    this.opts.targetWorkspaceId = toOid(id);
    return this;
  }

  toList(id: Id): this {
    this.opts.targetListId = toOid(id);
    return this;
  }

  asChildOf(id: Id | null): this {
    this.opts.targetParentId = id === null ? null : toOid(id);
    return this;
  }

  atOrder(order: number): this {
    this.opts.rootOrder = order;
    return this;
  }

  withSubtasks(yes = true): this {
    this.opts.withSubtasks = yes;
    return this;
  }

  withComments(yes = true): this {
    this.opts.withComments = yes;
    return this;
  }

  withoutComments(): this {
    this.opts.withComments = false;
    return this;
  }

  setStatus(status: string): this {
    this.opts.setStatus = status;
    return this;
  }

  resetStatus(to = 'todo'): this {
    this.opts.setStatus = to;
    return this;
  }

  setDates(dates: { startDate?: Date | null; dueDate?: Date | null }): this {
    this.opts.setDates = dates;
    return this;
  }

  resetTrackedTime(yes = true): this {
    this.opts.resetTrackedTime = yes;
    return this;
  }

  resetAssignee(yes = true): this {
    this.opts.resetAssignee = yes;
    return this;
  }

  async execute(): Promise<TaskDto> {
    if (!this.sourceId) {
      throw new BadRequestException('TaskCopyBuilder: source is not set');
    }
    if (!this.opts.targetWorkspaceId) {
      throw new BadRequestException(
        'TaskCopyBuilder: target workspace is not set',
      );
    }
    if (!this.opts.targetListId) {
      throw new BadRequestException(
        'TaskCopyBuilder: target list is not set',
      );
    }
    if (this.opts.targetParentId === undefined) {
      this.opts.targetParentId = null;
    }
    const args = {
      sourceId: this.sourceId,
      options: this.opts as CopyOptions,
    };
    return this.sourceKind === 'template'
      ? this.service.executeFromTemplate(args)
      : this.service.executeFromTask(args);
  }
}
