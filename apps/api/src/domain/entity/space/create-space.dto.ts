import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(120)
  name: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(32)
  color?: string;
}
