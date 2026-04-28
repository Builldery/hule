import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TaskTemplate,
  TaskTemplateSchema,
} from '../../../adapters/mongo/task-template.schema';
import { Space, SpaceSchema } from '../../../adapters/mongo/space.schema';
import {
  RecurringJob,
  RecurringJobSchema,
} from '../../../adapters/mongo/recurring-job.schema';
import { Action, ActionSchema } from '../../../adapters/mongo/action.schema';
import { TaskTemplateService } from './task-template.service';
import { TagModule } from '../tag/tag.module';
import { TaskCopyModule } from '../task-copy/task-copy.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaskTemplate.name, schema: TaskTemplateSchema },
      { name: Space.name, schema: SpaceSchema },
      { name: RecurringJob.name, schema: RecurringJobSchema },
      { name: Action.name, schema: ActionSchema },
    ]),
    TagModule,
    TaskCopyModule,
  ],
  providers: [TaskTemplateService],
  exports: [TaskTemplateService],
})
export class TaskTemplateModule {}
