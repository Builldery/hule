import { Module } from '@nestjs/common';
import { RecurringJobModule } from '../../../domain/modules/recurring-job/recurring-job.module';
import { RestApiRecurringTaskController } from './rest-api-recurring-task.controller';

@Module({
  imports: [RecurringJobModule],
  controllers: [RestApiRecurringTaskController],
})
export class RestApiRecurringTaskModule {}
