import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSpaceDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(32)
  color?: string;
}
