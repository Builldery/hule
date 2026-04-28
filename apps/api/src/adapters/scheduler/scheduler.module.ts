import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RecurringJobModule } from '../../domain/modules/recurring-job/recurring-job.module';
import { RecurringJobsScheduler } from './recurring-jobs.scheduler';

@Module({
  imports: [ScheduleModule.forRoot(), RecurringJobModule],
  providers: [RecurringJobsScheduler],
})
export class SchedulerModule {}
