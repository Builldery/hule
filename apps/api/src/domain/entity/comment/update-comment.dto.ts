import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(20000)
  body?: string;
}
