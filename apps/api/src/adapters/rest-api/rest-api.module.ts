import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { R2Module } from '../r2/r2.module';
import { RestApiAuthModule } from './auth/rest-api-auth.module';
import { RestApiHealthModule } from './health/rest-api-health.module';
import { RestApiWorkspaceModule } from './workspace/rest-api-workspace.module';
import { RestApiSpaceModule } from './space/rest-api-space.module';
import { RestApiListModule } from './list/rest-api-list.module';
import { RestApiTaskModule } from './task/rest-api-task.module';
import { RestApiTaskTemplateModule } from './task-template/rest-api-task-template.module';
import { RestApiRecurringTaskModule } from './recurring-task/rest-api-recurring-task.module';
import { RestApiActionModule } from './action/rest-api-action.module';
import { RestApiTagModule } from './tag/rest-api-tag.module';
import { RestApiCommentModule } from './comment/rest-api-comment.module';
import { RestApiFileModule } from './file/rest-api-file.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URL ?? 'mongodb://mongo:27017/hule',
        onConnectionCreate: (connection) => {
          connection.once('connected', () => console.log('\x1b[32m🍃 🍃 MongoDB connected successfully 🍃 🍃\x1b[0m',));
        },
      }),
    }),

    R2Module,
    RestApiAuthModule,
    RestApiHealthModule,
    RestApiWorkspaceModule,
    RestApiSpaceModule,
    RestApiListModule,
    RestApiTaskModule,
    RestApiTaskTemplateModule,
    RestApiRecurringTaskModule,
    RestApiActionModule,
    RestApiTagModule,
    RestApiCommentModule,
    RestApiFileModule,
    SchedulerModule,
  ],
})
export class RestApiModule {}
