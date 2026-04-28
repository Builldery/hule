import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ETaskPriority } from '../task/task.constants';
import { RecurrenceScheduleDto } from './recurrence-schedule.dto';

export class UpdateRecurringTaskTemplateDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(500)
  title?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsString() @MaxLength(20000)
  description?: string | null;

  @ApiProperty({ required: false, enum: ETaskPriority })
  @IsEnum(ETaskPriority) @IsOptional()
  priority?: ETaskPriority;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayUnique() @IsMongoId({ each: true })
  tagIds?: Array<string>;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsInt() @Min(0)
  timeEstimate?: number | null;
}

export class UpdateRecurringTaskDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(200)
  name?: string;

  @ApiProperty({ required: false }) @IsMongoId() @IsOptional()
  targetListId?: string;

  @ApiProperty({ required: false }) @IsBoolean() @IsOptional()
  active?: boolean;

  @ApiProperty({ required: false, type: UpdateRecurringTaskTemplateDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateRecurringTaskTemplateDto)
  template?: UpdateRecurringTaskTemplateDto;

  @ApiProperty({ required: false, type: RecurrenceScheduleDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecurrenceScheduleDto)
  schedule?: RecurrenceScheduleDto;
}
