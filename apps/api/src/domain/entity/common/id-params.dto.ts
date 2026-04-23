import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class IdParamsDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  id: string;
}
