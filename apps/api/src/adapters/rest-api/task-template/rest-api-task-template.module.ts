import { Module } from '@nestjs/common';
import { TaskTemplateModule } from '../../../domain/modules/task-template/task-template.module';
import { RestApiTaskTemplateController } from './rest-api-task-template.controller';

@Module({
  imports: [TaskTemplateModule],
  controllers: [RestApiTaskTemplateController],
})
export class RestApiTaskTemplateModule {}
