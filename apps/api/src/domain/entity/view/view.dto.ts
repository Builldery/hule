import { ApiProperty } from '@nestjs/swagger';
import { EViewKind } from './view.constants';

export class ViewDto {
  @ApiProperty() id: string;
  @ApiProperty() label: string;
  @ApiProperty({ enum: EViewKind }) kind: EViewKind;
  @ApiProperty({ type: [String] }) listIds: Array<string>;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: ViewDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.label = raw?.label;
    this.kind = raw?.kind;
    this.listIds = Array.isArray(raw?.listIds)
      ? raw.listIds.map((x: any) => x?.toString())
      : [];
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }
}
