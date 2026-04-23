import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RestApiHealthModule } from './health/rest-api-health.module';
import { RestApiSpaceModule } from './space/rest-api-space.module';
import { RestApiListModule } from './list/rest-api-list.module';
import { RestApiTaskModule } from './task/rest-api-task.module';
import { RestApiCommentModule } from './comment/rest-api-comment.module';
import { RestApiFileModule } from './file/rest-api-file.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL ?? 'mongodb://mongo:27017/hule'),

    RestApiHealthModule,
    RestApiSpaceModule,
    RestApiListModule,
    RestApiTaskModule,
    RestApiCommentModule,
    RestApiFileModule,
  ],
})
export class RestApiModule {}
