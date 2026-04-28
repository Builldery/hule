import { Module } from '@nestjs/common';
import { ActionModule } from '../../../domain/modules/action/action.module';
import { RestApiActionController } from './rest-api-action.controller';

@Module({
  imports: [ActionModule],
  controllers: [RestApiActionController],
})
export class RestApiActionModule {}
