import { ApiProperty } from '@nestjs/swagger';
import { EPinEntity } from './pin.constants';

export class PinDto {
  @ApiProperty() id: string;
  @ApiProperty() label: string;
  @ApiProperty({ required: false }) iconName?: string;
  @ApiProperty() order: number;
  @ApiProperty({ enum: EPinEntity }) entity: EPinEntity;
  @ApiProperty() entityId: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: PinDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.label = raw?.label;
    this.iconName = raw?.iconName;
    this.order = raw?.order ?? 0;
    this.entity = raw?.entity;
    this.entityId = raw?.entityId?.toString();
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
