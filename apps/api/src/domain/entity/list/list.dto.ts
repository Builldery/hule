import { ApiProperty } from '@nestjs/swagger';

export class ListDto {
  @ApiProperty() id: string;
  @ApiProperty() workspaceId: string;
  @ApiProperty() spaceId: string;
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) iconName?: string;
  @ApiProperty() order: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: ListDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.workspaceId = raw?.workspaceId?.toString();
    this.spaceId = raw?.spaceId?.toString();
    this.name = raw?.name;
    this.iconName = raw?.iconName;
    this.order = raw?.order ?? 0;
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
