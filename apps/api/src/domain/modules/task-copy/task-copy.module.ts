import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from '../../../adapters/mongo/task.schema';
import {
  Comment,
  CommentSchema,
} from '../../../adapters/mongo/comment.schema';
import { List, ListSchema } from '../../../adapters/mongo/list.schema';
import {
  TaskTemplate,
  TaskTemplateSchema,
} from '../../../adapters/mongo/task-template.schema';
import { TaskCopyService } from './task-copy.service';
import { TaskSourceLoader } from './loaders/task-source.loader';
import { TaskTemplateSourceLoader } from './loaders/task-template-source.loader';
import { RemapIdsStage } from './stages/remap-ids.stage';
import { TransformStage } from './stages/transform.stage';
import { PersistStage } from './stages/persist.stage';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: List.name, schema: ListSchema },
      { name: TaskTemplate.name, schema: TaskTemplateSchema },
    ]),
  ],
  providers: [
    TaskCopyService,
    TaskSourceLoader,
    TaskTemplateSourceLoader,
    RemapIdsStage,
    TransformStage,
    PersistStage,
  ],
  exports: [TaskCopyService],
})
export class TaskCopyModule {}
