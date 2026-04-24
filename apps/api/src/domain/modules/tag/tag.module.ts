import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from '../../../adapters/mongo/tag.schema';
import { Task, TaskSchema } from '../../../adapters/mongo/task.schema';
import { TagService } from './tag.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
