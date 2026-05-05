import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class SpaceIdParamsDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  spaceId: string;
}

export class SpaceShareTargetParamsDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  spaceId: string;

  @ApiProperty() @IsMongoId() @IsNotEmpty()
  userId: string;
}
