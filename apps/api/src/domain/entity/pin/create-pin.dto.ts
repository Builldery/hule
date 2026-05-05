import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EPinEntity } from './pin.constants';

export class CreatePinDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(120)
  label: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional() @MaxLength(64)
  iconName?: string;

  @ApiProperty({ enum: EPinEntity }) @IsEnum(EPinEntity) @IsNotEmpty()
  entity: EPinEntity;

  @ApiProperty() @IsMongoId() @IsNotEmpty()
  entityId: string;
}
