import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceDto } from './workspace.dto';

export class WorkspaceCreatedDto {
  @ApiProperty() access_token: string;
  @ApiProperty({ type: WorkspaceDto }) workspace: WorkspaceDto;

  constructor(access_token: string, workspace: WorkspaceDto) {
    this.access_token = access_token;
    this.workspace = workspace;
  }
}
