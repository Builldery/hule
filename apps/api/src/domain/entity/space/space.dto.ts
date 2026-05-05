import { ApiProperty } from '@nestjs/swagger';
import { ESpaceShareRole } from './space.constants';

export class SpaceShareEntryDto {
  @ApiProperty() userId: string;
  @ApiProperty({ enum: ESpaceShareRole }) role: ESpaceShareRole;

  constructor(raw: SpaceShareEntryDto | any) {
    this.userId = raw?.userId?.toString();
    this.role = raw?.role;
  }
}

export class SpaceDto {
  @ApiProperty() id: string;
  @ApiProperty() workspaceId: string;
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) color?: string;
  @ApiProperty({ required: false }) iconName?: string;
  @ApiProperty() order: number;
  @ApiProperty({ type: [SpaceShareEntryDto] })
  sharedWith: Array<SpaceShareEntryDto>;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: SpaceDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.workspaceId = raw?.workspaceId?.toString();
    this.name = raw?.name;
    this.color = raw?.color;
    this.iconName = raw?.iconName;
    this.order = raw?.order ?? 0;
    this.sharedWith = Array.isArray(raw?.sharedWith)
      ? raw.sharedWith.map((e: any) => new SpaceShareEntryDto(e))
      : [];
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
