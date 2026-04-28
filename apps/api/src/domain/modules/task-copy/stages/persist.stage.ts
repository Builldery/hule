import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../../../../adapters/mongo/task.schema';
import {
  Comment,
  CommentDocument,
} from '../../../../adapters/mongo/comment.schema';
import { CopyPlan } from '../task-copy.types';

@Injectable()
export class PersistStage {
  @InjectModel(Task.name) private taskModel: Model<TaskDocument>;
  @InjectModel(Comment.name) private commentModel: Model<CommentDocument>;

  async run(plan: CopyPlan): Promise<CopyPlan> {
    if (!plan.plannedTasks.length) return plan;

    if (plan.options.rootOrder === undefined) {
      const last = await this.taskModel
        .findOne({
          workspaceId: plan.options.targetWorkspaceId,
          listId: plan.options.targetListId,
          parentId: plan.options.targetParentId,
        })
        .sort({ order: -1 });
      const nextOrder = (last?.order ?? -1) + 1;
      const root = plan.plannedTasks.find(
        (t) => plan.resultRootId && t._id.equals(plan.resultRootId),
      );
      if (root) root.order = nextOrder;
    }

    await this.taskModel.insertMany(plan.plannedTasks);
    if (plan.plannedComments.length) {
      await this.commentModel.insertMany(plan.plannedComments);
    }
    return plan;
  }
}
