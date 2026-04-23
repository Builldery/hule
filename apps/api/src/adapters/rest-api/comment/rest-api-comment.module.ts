import { Module } from '@nestjs/common';
import { CommentModule } from '../../../domain/modules/comment/comment.module';
import { RestApiCommentController } from './rest-api-comment.controller';

@Module({
  imports: [CommentModule],
  controllers: [RestApiCommentController],
})
export class RestApiCommentModule {}
