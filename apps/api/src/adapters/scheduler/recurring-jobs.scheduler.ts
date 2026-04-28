import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringJobService } from '../../domain/modules/recurring-job/recurring-job.service';

@Injectable()
export class RecurringJobsScheduler {
  private readonly logger = new Logger(RecurringJobsScheduler.name);

  constructor(private readonly recurringJobService: RecurringJobService) {}

  @Cron(CronExpression.EVERY_MINUTE, { name: 'recurring-jobs-tick' })
  async tick(): Promise<void> {
    try {
      const spawned = await this.recurringJobService.tickDue();
      if (spawned > 0) {
        this.logger.log(`Spawned ${spawned} recurring task instance(s)`);
      }
    } catch (err) {
      this.logger.error(
        `Recurring jobs tick failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
