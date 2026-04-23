import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ETaskPriority } from './task.constants';

export class UpdateTaskDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(500)
  title?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsString() @MaxLength(20000)
  description?: string | null;

  @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(40)
  status?: string;

  @ApiProperty({ required: false, enum: ETaskPriority })
  @IsEnum(ETaskPriority) @IsOptional()
  priority?: ETaskPriority;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsDateString()
  startDate?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsDateString()
  dueDate?: string | null;
}
