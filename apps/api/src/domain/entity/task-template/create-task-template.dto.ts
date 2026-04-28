import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ETaskPriority } from '../task/task.constants';

export class CreateTaskTemplateDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsMongoId()
  parentId?: string | null;

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
