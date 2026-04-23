import { Module } from '@nestjs/common';
import { TaskModule } from '../../../domain/modules/task/task.module';
import { RestApiTaskController } from './rest-api-task.controller';

@Module({
  imports: [TaskModule],
  controllers: [RestApiTaskController],
})
export class RestApiTaskModule {}
