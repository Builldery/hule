import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EViewKind } from './view.constants';

export class UpdateViewDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  label?: string;

  @ApiProperty({ required: false, enum: EViewKind }) @IsOptional() @IsEnum(EViewKind)
  kind?: EViewKind;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayUnique() @IsMongoId({ each: true })
  listIds?: Array<string>;
}
