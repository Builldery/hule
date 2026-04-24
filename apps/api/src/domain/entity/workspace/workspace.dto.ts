import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() ownerId: string;
  @ApiProperty({ type: [String] }) memberIds: Array<string>;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: WorkspaceDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.name = raw?.name;
    this.ownerId = raw?.ownerId?.toString();
    this.memberIds = Array.isArray(raw?.memberIds)
      ? raw.memberIds.map((m: any) => m.toString())
      : [];
    this.createdAt =
      raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt =
      raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
