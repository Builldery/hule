import { ApiProperty } from '@nestjs/swagger';

export class SpaceDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ required: false }) color?: string;
  @ApiProperty() order: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: SpaceDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.name = raw?.name;
    this.color = raw?.color;
    this.order = raw?.order ?? 0;
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
