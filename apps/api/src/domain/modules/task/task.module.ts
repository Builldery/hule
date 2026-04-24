import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from '../../../adapters/mongo/task.schema';
import { Comment, CommentSchema } from '../../../adapters/mongo/comment.schema';
import { List, ListSchema } from '../../../adapters/mongo/list.schema';
import {
  Workspace,
  WorkspaceSchema,
} from '../../../adapters/mongo/workspace.schema';
import { TaskService } from './task.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: List.name, schema: ListSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
  ],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
