import { Module } from '@nestjs/common';
import { SpaceShareModule } from '../../../domain/modules/space-share/space-share.module';
import { RestApiSpaceShareController } from './rest-api-space-share.controller';

@Module({
  imports: [SpaceShareModule],
  controllers: [RestApiSpaceShareController],
})
export class RestApiSpaceShareModule {}
