import { ApiProperty } from '@nestjs/swagger';
import { EPinEntity } from './pin.constants';

export class PinDto {
  @ApiProperty() id: string;
  @ApiProperty() workspaceId: string;
  @ApiProperty({ required: false, nullable: true })
  userId: string | null;
  @ApiProperty() label: string;
  @ApiProperty({ required: false }) iconName?: string;
  @ApiProperty() order: number;
  @ApiProperty({ enum: EPinEntity }) entity: EPinEntity;
  @ApiProperty() entityId: string;
  @ApiProperty({ required: false, nullable: true })
  entityWorkspaceId: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: PinDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.workspaceId = raw?.workspaceId?.toString();
    this.userId = raw?.userId ? raw.userId.toString() : null;
    this.label = raw?.label;
    this.iconName = raw?.iconName;
    this.order = raw?.order ?? 0;
    this.entity = raw?.entity;
    this.entityId = raw?.entityId?.toString();
    this.entityWorkspaceId = raw?.entityWorkspaceId
      ? raw.entityWorkspaceId.toString()
      : null;
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
