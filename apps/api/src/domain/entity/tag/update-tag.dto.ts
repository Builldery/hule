import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ETagColor } from './tag.constants';

export class UpdateTagDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(40)
  name?: string;

  @ApiProperty({ required: false, enum: ETagColor })
  @IsEnum(ETagColor) @IsOptional()
  color?: ETagColor;
}
