import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RecurringJob,
  RecurringJobSchema,
} from '../../../adapters/mongo/recurring-job.schema';
import {
  TaskTemplate,
  TaskTemplateSchema,
} from '../../../adapters/mongo/task-template.schema';
import { List, ListSchema } from '../../../adapters/mongo/list.schema';
import { RecurringJobService } from './recurring-job.service';
import { TagModule } from '../tag/tag.module';
import { TaskCopyModule } from '../task-copy/task-copy.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringJob.name, schema: RecurringJobSchema },
      { name: TaskTemplate.name, schema: TaskTemplateSchema },
      { name: List.name, schema: ListSchema },
    ]),
    TagModule,
    TaskCopyModule,
  ],
  providers: [RecurringJobService],
  exports: [RecurringJobService],
})
export class RecurringJobModule {}
