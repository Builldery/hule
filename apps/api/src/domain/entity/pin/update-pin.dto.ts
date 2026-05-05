import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePinDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(120)
  label?: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(64)
  iconName?: string;
}
