import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ERecurrenceKind } from './recurring-job.constants';

export class RecurrenceScheduleDto {
  @ApiProperty({ enum: ERecurrenceKind })
  @IsEnum(ERecurrenceKind)
  kind: ERecurrenceKind;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'timeOfDay must be HH:MM (24h)',
  })
  timeOfDay: string;

  @ApiProperty({ required: false, description: '1=Mon..7=Sun, required for weekly' })
  @ValidateIf((o) => o.kind === ERecurrenceKind.Weekly)
  @IsInt()
  @Min(1)
  @Max(7)
  weekday?: number;

  @ApiProperty({ required: false, description: '1..31, required for monthly/yearly' })
  @ValidateIf(
    (o) =>
      o.kind === ERecurrenceKind.Monthly || o.kind === ERecurrenceKind.Yearly,
  )
  @IsInt()
  @Min(1)
  @Max(31)
  monthDay?: number;

  @ApiProperty({ required: false, description: '1..12, required for yearly' })
  @ValidateIf((o) => o.kind === ERecurrenceKind.Yearly)
  @IsInt()
  @Min(1)
  @Max(12)
  monthOfYear?: number;
}
