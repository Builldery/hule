import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class SpawnFromTemplateDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  listId: string;

  @ApiProperty({ required: false }) @IsDateString() @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false }) @IsDateString() @IsOptional()
  dueDate?: string;
}
