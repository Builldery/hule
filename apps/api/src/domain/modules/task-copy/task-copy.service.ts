import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../../../adapters/mongo/task.schema';
import { List } from '../../../adapters/mongo/list.schema';
import { TaskDto } from '../../entity/task/task.dto';
import { TaskCopyBuilder } from './task-copy.builder';
import { TaskSourceLoader } from './loaders/task-source.loader';
import { TaskTemplateSourceLoader } from './loaders/task-template-source.loader';
import { ISourceLoader } from './loaders/source-loader.interface';
import { RemapIdsStage } from './stages/remap-ids.stage';
import { TransformStage } from './stages/transform.stage';
import { PersistStage } from './stages/persist.stage';
import { CopyOptions, CopyPlan } from './task-copy.types';

@Injectable()
export class TaskCopyService {
  @InjectModel(Task.name) private taskModel: Model<TaskDocument>;
  @InjectModel(List.name) private listModel: Model<List>;

  constructor(
    private readonly taskSourceLoader: TaskSourceLoader,
    private readonly taskTemplateSourceLoader: TaskTemplateSourceLoader,
    private readonly remapIdsStage: RemapIdsStage,
    private readonly transformStage: TransformStage,
    private readonly persistStage: PersistStage,
  ) {}

  builder(): TaskCopyBuilder {
    return new TaskCopyBuilder(this);
  }

  executeFromTask(args: {
    sourceId: Types.ObjectId;
    options: CopyOptions;
  }): Promise<TaskDto> {
    return this.executeWithLoader(this.taskSourceLoader, args);
  }

  executeFromTemplate(args: {
    sourceId: Types.ObjectId;
    options: CopyOptions;
  }): Promise<TaskDto> {
    return this.executeWithLoader(this.taskTemplateSourceLoader, args);
  }

  private async executeWithLoader(
    loader: ISourceLoader,
    args: { sourceId: Types.ObjectId; options: CopyOptions },
  ): Promise<TaskDto> {
    const opts = args.options;

    const targetList = await this.listModel.findOne({
      _id: opts.targetListId,
      workspaceId: opts.targetWorkspaceId,
    });
    if (!targetList) throw new BadRequestException('Target list not found');

    let targetParentPath: Array<Types.ObjectId> = [];
    if (opts.targetParentId) {
      const parent = await this.taskModel.findOne({
        _id: opts.targetParentId,
        workspaceId: opts.targetWorkspaceId,
      });
      if (!parent) throw new BadRequestException('Target parent not found');
      targetParentPath = [...parent.path, parent._id as Types.ObjectId];
    }

    const source = await loader.load({
      workspaceId: opts.targetWorkspaceId,
      rootId: args.sourceId,
      withSubtasks: opts.withSubtasks,
      withComments: opts.withComments,
    });

    let plan: CopyPlan = {
      source,
      options: opts,
      idMap: new Map(),
      targetParentPath,
      plannedTasks: [],
      plannedComments: [],
      resultRootId: null,
    };

    plan = this.remapIdsStage.run(plan);
    plan = this.transformStage.run(plan);
    plan = await this.persistStage.run(plan);

    if (!plan.resultRootId) {
      throw new NotFoundException('Copy result missing root');
    }
    const rootDoc = await this.taskModel.findById(plan.resultRootId);
    if (!rootDoc) {
      throw new NotFoundException('Copy result not found after insert');
    }
    return new TaskDto(rootDoc);
  }
}
