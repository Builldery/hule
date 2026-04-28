import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, Min, ValidateIf } from 'class-validator';

export class MoveTaskTemplateDto {
  @ApiProperty({ required: false })
  @IsOptional() @IsMongoId()
  spaceId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null && v !== undefined)
  @IsMongoId()
  parentId?: string | null;

  @ApiProperty() @IsInt() @Min(0)
  order: number;
}
