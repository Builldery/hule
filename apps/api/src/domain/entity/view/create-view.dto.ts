import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EViewKind } from './view.constants';

export class CreateViewDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(120)
  label: string;

  @ApiProperty({ enum: EViewKind }) @IsEnum(EViewKind)
  kind: EViewKind;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayUnique() @IsMongoId({ each: true })
  listIds?: Array<string>;
}
