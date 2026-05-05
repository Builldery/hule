import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { EViewKind } from './view.constants';
import { ViewListRefInputDto } from './create-view.dto';

export class UpdateViewDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  label?: string;

  @ApiProperty({ required: false, enum: EViewKind }) @IsOptional() @IsEnum(EViewKind)
  kind?: EViewKind;

  @ApiProperty({ required: false, type: [ViewListRefInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewListRefInputDto)
  listRefs?: Array<ViewListRefInputDto>;
}
