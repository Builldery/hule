import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class TimelineQueryDto {
  @ApiProperty({ required: false }) @IsMongoId() @IsOptional()
  spaceId?: string;

  @ApiProperty({ required: false }) @IsMongoId() @IsOptional()
  listId?: string;

  @ApiProperty({ required: false }) @IsDateString() @IsOptional()
  from?: string;

  @ApiProperty({ required: false }) @IsDateString() @IsOptional()
  to?: string;
}
