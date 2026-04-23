import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '../../../adapters/mongo/comment.schema';
import { Task, TaskSchema } from '../../../adapters/mongo/task.schema';
import { CommentService } from './comment.service';
import { GridfsModule } from '../../../adapters/gridfs/gridfs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    GridfsModule,
  ],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
