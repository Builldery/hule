import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../../../../adapters/mongo/task.schema';
import {
  Comment,
  CommentDocument,
} from '../../../../adapters/mongo/comment.schema';
import {
  ISourceLoader,
  SourceLoadOptions,
} from './source-loader.interface';
import {
  SourceComment,
  SourceNode,
  SourceTree,
} from '../task-copy.types';

@Injectable()
export class TaskSourceLoader implements ISourceLoader {
  @InjectModel(Task.name) private taskModel: Model<TaskDocument>;
  @InjectModel(Comment.name) private commentModel: Model<CommentDocument>;

  async load(opts: SourceLoadOptions): Promise<SourceTree> {
    const root = await this.taskModel.findOne({
      _id: opts.rootId,
      workspaceId: opts.workspaceId,
    });
    if (!root) throw new NotFoundException('Source task not found');

    const descendants = opts.withSubtasks
      ? await this.taskModel
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
      status: d.status,
      priority: d.priority,
      startDate: d.startDate,
      dueDate: d.dueDate,
      assigneeId: d.assigneeId,
      tagIds: d.tagIds,
      timeEstimate: d.timeEstimate,
      trackedTime: d.trackedTime,
    }));

    let comments: Array<SourceComment> = [];
    if (opts.withComments) {
      const taskIds = allDocs.map((d) => d._id);
      const docs = await this.commentModel
        .find({ workspaceId: opts.workspaceId, taskId: { $in: taskIds } })
        .sort({ createdAt: 1 });
      comments = docs.map((c) => ({
        sourceTaskId: c.taskId,
        workspaceId: c.workspaceId,
        kind: c.kind,
        body: c.body,
        activity: c.activity,
        createdAt: (c as unknown as { createdAt: Date }).createdAt,
      }));
    }

    return {
      rootSourceId: opts.rootId,
      workspaceId: opts.workspaceId,
      nodes,
      comments,
    };
  }
}
