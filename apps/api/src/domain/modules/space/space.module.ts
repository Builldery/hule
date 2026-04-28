import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Space, SpaceSchema } from '../../../adapters/mongo/space.schema';
import { List, ListSchema } from '../../../adapters/mongo/list.schema';
import { SpaceService } from './space.service';
import { ListModule } from '../list/list.module';
import { TaskTemplateModule } from '../task-template/task-template.module';
import { RecurringJobModule } from '../recurring-job/recurring-job.module';
import { ActionModule } from '../action/action.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Space.name, schema: SpaceSchema },
      { name: List.name, schema: ListSchema },
    ]),
    ListModule,
    TaskTemplateModule,
    RecurringJobModule,
    ActionModule,
  ],
  providers: [SpaceService],
  exports: [SpaceService],
})
export class SpaceModule {}
