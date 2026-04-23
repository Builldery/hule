import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { List, ListSchema } from '../../../adapters/mongo/list.schema';
import { Space, SpaceSchema } from '../../../adapters/mongo/space.schema';
import { ListService } from './list.service';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: List.name, schema: ListSchema },
      { name: Space.name, schema: SpaceSchema },
    ]),
    TaskModule,
  ],
  providers: [ListService],
  exports: [ListService],
})
export class ListModule {}
