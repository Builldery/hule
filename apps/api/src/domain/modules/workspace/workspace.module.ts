import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Workspace,
  WorkspaceSchema,
} from '../../../adapters/mongo/workspace.schema';
import { WorkspaceService } from './workspace.service';
import { UserModule } from '../user/user.module';
import { SpaceModule } from '../space/space.module';
import { FileModule } from '../file/file.module';
import { TagModule } from '../tag/tag.module';
import { RecurringJobModule } from '../recurring-job/recurring-job.module';
import { ActionModule } from '../action/action.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
    UserModule,
    SpaceModule,
    FileModule,
    TagModule,
    RecurringJobModule,
    ActionModule,
  ],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
