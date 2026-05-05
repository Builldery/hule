import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateListDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  spaceId: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(120)
  name: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(64)
  iconName?: string;
}
