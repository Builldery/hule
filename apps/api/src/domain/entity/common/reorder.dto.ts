import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsNotEmpty, Min } from 'class-validator';

export class ReorderItemDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  id: string;

  @ApiProperty() @IsInt() @Min(0)
  order: number;
}
