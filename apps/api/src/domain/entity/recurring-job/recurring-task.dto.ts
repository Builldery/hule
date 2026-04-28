import { ApiProperty } from '@nestjs/swagger';
import { ETaskPriority } from '../task/task.constants';
import { ERecurrenceKind } from './recurring-job.constants';

export class RecurringTaskTemplateSnapshotDto {
  @ApiProperty() title: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ enum: ETaskPriority }) priority: ETaskPriority;
  @ApiProperty({ type: [String] }) tagIds: Array<string>;
  @ApiProperty({ required: false }) timeEstimate?: number;
}

export class RecurringTaskScheduleSnapshotDto {
  @ApiProperty({ enum: ERecurrenceKind }) kind: ERecurrenceKind;
  @ApiProperty() timeOfDay: string;
  @ApiProperty({ required: false }) weekday?: number;
  @ApiProperty({ required: false }) monthDay?: number;
  @ApiProperty({ required: false }) monthOfYear?: number;
}

export class RecurringTaskDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() templateId: string;
  @ApiProperty() targetListId: string;
  @ApiProperty() spaceId: string;

  @ApiProperty({ type: RecurringTaskTemplateSnapshotDto })
  template: RecurringTaskTemplateSnapshotDto;

  @ApiProperty({ type: RecurringTaskScheduleSnapshotDto })
  schedule: RecurringTaskScheduleSnapshotDto;

  @ApiProperty() active: boolean;
  @ApiProperty() nextRunAt: string;
  @ApiProperty({ nullable: true }) lastRunAt: string | null;
  @ApiProperty({ nullable: true }) lastSpawnedTaskId: string | null;

  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(jobRaw: any, templateRaw: any) {
    this.id = jobRaw?._id?.toString() ?? jobRaw?.id?.toString();
    this.name = jobRaw?.name;
    this.templateId = jobRaw?.templateId?.toString();
    this.targetListId = jobRaw?.targetListId?.toString();
    this.spaceId = jobRaw?.spaceId?.toString();

    this.template = {
      title: templateRaw?.title,
      description: templateRaw?.description,
      priority: templateRaw?.priority,
      tagIds: Array.isArray(templateRaw?.tagIds)
        ? templateRaw.tagIds.map((t: any) => t.toString())
        : [],
      timeEstimate: templateRaw?.timeEstimate,
    };

    this.schedule = {
      kind: jobRaw?.kind,
      timeOfDay: jobRaw?.timeOfDay,
      weekday: jobRaw?.weekday,
      monthDay: jobRaw?.monthDay,
      monthOfYear: jobRaw?.monthOfYear,
    };

    this.active = !!jobRaw?.active;
    this.nextRunAt =
      jobRaw?.nextRunAt instanceof Date
        ? jobRaw.nextRunAt.toISOString()
        : jobRaw?.nextRunAt;
    this.lastRunAt = jobRaw?.lastRunAt
      ? jobRaw.lastRunAt instanceof Date
        ? jobRaw.lastRunAt.toISOString()
        : jobRaw.lastRunAt
      : null;
    this.lastSpawnedTaskId = jobRaw?.lastSpawnedTaskId
      ? jobRaw.lastSpawnedTaskId.toString()
      : null;

    this.createdAt =
      jobRaw?.createdAt instanceof Date
        ? jobRaw.createdAt.toISOString()
        : jobRaw?.createdAt;
    this.updatedAt =
      jobRaw?.updatedAt instanceof Date
        ? jobRaw.updatedAt.toISOString()
        : jobRaw?.updatedAt;
  }
}
