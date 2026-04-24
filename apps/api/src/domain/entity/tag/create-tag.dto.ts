import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ETagColor } from './tag.constants';

export class CreateTagDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(40)
  name: string;

  @ApiProperty({ required: false, enum: ETagColor, default: ETagColor.Gray })
  @IsEnum(ETagColor) @IsOptional()
  color?: ETagColor = ETagColor.Gray;
}
