import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ETaskPriority } from '../task/task.constants';
import { RecurrenceScheduleDto } from './recurrence-schedule.dto';

export class CreateRecurringTaskTemplateDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(500)
  title: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(20000)
  description?: string;

  @ApiProperty({ required: false, enum: ETaskPriority, default: ETaskPriority.None })
  @IsEnum(ETaskPriority) @IsOptional()
  priority?: ETaskPriority = ETaskPriority.None;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayUnique() @IsMongoId({ each: true })
  tagIds?: Array<string>;

  @ApiProperty({ required: false })
  @IsOptional() @IsInt() @Min(0)
  timeEstimate?: number;
}

export class CreateRecurringTaskDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(200)
  name: string;

  @ApiProperty() @IsMongoId() @IsNotEmpty()
  targetListId: string;

  @ApiProperty({ type: CreateRecurringTaskTemplateDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CreateRecurringTaskTemplateDto)
  template: CreateRecurringTaskTemplateDto;

  @ApiProperty({ type: RecurrenceScheduleDto })
  @IsObject()
  @ValidateNested()
  @Type(() => RecurrenceScheduleDto)
  schedule: RecurrenceScheduleDto;
}
