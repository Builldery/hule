import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { WorkspaceModule } from '../../../domain/modules/workspace/workspace.module';
import { AuthModule } from '../../../domain/modules/auth/auth.module';
import { WorkspaceAccessGuard } from '../guards/workspace-access.guard';
import { RestApiWorkspaceController } from './rest-api-workspace.controller';

@Module({
  imports: [WorkspaceModule, AuthModule],
  controllers: [RestApiWorkspaceController],
  providers: [{ provide: APP_GUARD, useClass: WorkspaceAccessGuard }],
})
export class RestApiWorkspaceModule {}
