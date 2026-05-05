import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';
import { EViewKind } from './view.constants';

export class ViewListRefInputDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  listId: string;

  @ApiProperty() @IsMongoId() @IsNotEmpty()
  workspaceId: string;
}

export class CreateViewDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(120)
  label: string;

  @ApiProperty({ enum: EViewKind }) @IsEnum(EViewKind)
  kind: EViewKind;

  @ApiProperty({
    required: false,
    type: [ViewListRefInputDto],
    description:
      'Lists this view aggregates. Each ref carries listId + the workspace it belongs to (use the current workspace for own lists, or the foreign workspace for shared lists).',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewListRefInputDto)
  listRefs?: Array<ViewListRefInputDto>;
}
