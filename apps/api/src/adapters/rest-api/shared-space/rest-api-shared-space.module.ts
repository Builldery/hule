import { Module } from '@nestjs/common';
import { SpaceShareModule } from '../../../domain/modules/space-share/space-share.module';
import { TaskModule } from '../../../domain/modules/task/task.module';
import { RestApiSharedSpaceController } from './rest-api-shared-space.controller';

@Module({
  imports: [SpaceShareModule, TaskModule],
  controllers: [RestApiSharedSpaceController],
})
export class RestApiSharedSpaceModule {}
