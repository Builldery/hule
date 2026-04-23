import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ListsQueryDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  spaceId: string;
}
