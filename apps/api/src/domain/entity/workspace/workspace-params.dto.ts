import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class WorkspaceIdParamsDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  workspaceId: string;
}

export class WorkspaceMemberParamsDto {
  @ApiProperty() @IsMongoId() @IsNotEmpty()
  workspaceId: string;

  @ApiProperty() @IsMongoId() @IsNotEmpty()
  memberId: string;
}
