import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ETaskPriority } from '../task/task.constants';

export class UpdateTaskTemplateDto {
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
