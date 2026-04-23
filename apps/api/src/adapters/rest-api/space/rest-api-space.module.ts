import { Module } from '@nestjs/common';
import { SpaceModule } from '../../../domain/modules/space/space.module';
import { RestApiSpaceController } from './rest-api-space.controller';

@Module({
  imports: [SpaceModule],
  controllers: [RestApiSpaceController],
})
export class RestApiSpaceModule {}
