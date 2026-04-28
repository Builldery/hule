import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TaskTemplate,
  TaskTemplateDocument,
} from '../../../../adapters/mongo/task-template.schema';
import {
  ISourceLoader,
  SourceLoadOptions,
} from './source-loader.interface';
import { SourceNode, SourceTree } from '../task-copy.types';

@Injectable()
export class TaskTemplateSourceLoader implements ISourceLoader {
  @InjectModel(TaskTemplate.name)
  private templateModel: Model<TaskTemplateDocument>;

  async load(opts: SourceLoadOptions): Promise<SourceTree> {
    const root = await this.templateModel.findOne({
      _id: opts.rootId,
      workspaceId: opts.workspaceId,
    });
    if (!root) throw new NotFoundException('Source template not found');

    const descendants = opts.withSubtasks
      ? await this.templateModel
          .find({ workspaceId: opts.workspaceId, path: opts.rootId })
          .sort({ depth: 1, order: 1 })
      : [];

    const allDocs = [root, ...descendants];
    const nodes: Array<SourceNode> = allDocs.map((d) => ({
      sourceId: d._id as Types.ObjectId,
      parentSourceId: d.parentId,
      sourcePath: d.path,
      sourceDepth: d.depth,
      order: d.order,
      workspaceId: d.workspaceId,
      title: d.title,
      description: d.description,
      status: 'todo',
      priority: d.priority,
      startDate: undefined,
      dueDate: undefined,
      assigneeId: null,
      tagIds: d.tagIds,
      timeEstimate: d.timeEstimate,
      trackedTime: undefined,
    }));

    return {
      rootSourceId: opts.rootId,
      workspaceId: opts.workspaceId,
      nodes,
      comments: [],
    };
  }
}
