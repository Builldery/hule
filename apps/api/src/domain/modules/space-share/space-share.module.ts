import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Space, SpaceSchema } from '../../../adapters/mongo/space.schema';
import { List, ListSchema } from '../../../adapters/mongo/list.schema';
import {
  Workspace,
  WorkspaceSchema,
} from '../../../adapters/mongo/workspace.schema';
import { User, UserSchema } from '../../../adapters/mongo/user.schema';
import { SpaceShareService } from './space-share.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Space.name, schema: SpaceSchema },
      { name: List.name, schema: ListSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UserModule,
  ],
  providers: [SpaceShareService],
  exports: [SpaceShareService],
})
export class SpaceShareModule {}
