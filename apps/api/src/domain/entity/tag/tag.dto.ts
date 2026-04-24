import { ApiProperty } from '@nestjs/swagger';
import { ETagColor } from './tag.constants';

export class TagDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ETagColor }) color: ETagColor;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: TagDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.name = raw?.name;
    this.color = raw?.color;
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
