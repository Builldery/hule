import { ApiProperty } from '@nestjs/swagger';
import { EViewKind } from './view.constants';

export class ViewListRefDto {
  @ApiProperty() listId: string;
  @ApiProperty() workspaceId: string;

  constructor(raw: ViewListRefDto | any) {
    this.listId = raw?.listId?.toString();
    this.workspaceId = raw?.workspaceId?.toString();
  }
}

export class ViewDto {
  @ApiProperty() id: string;
  @ApiProperty() workspaceId: string;
  @ApiProperty({ required: false, nullable: true })
  userId: string | null;
  @ApiProperty() label: string;
  @ApiProperty({ enum: EViewKind }) kind: EViewKind;
  @ApiProperty({ type: [ViewListRefDto] })
  listRefs: Array<ViewListRefDto>;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  constructor(raw: ViewDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.workspaceId = raw?.workspaceId?.toString();
    this.userId = raw?.userId ? raw.userId.toString() : null;
    this.label = raw?.label;
    this.kind = raw?.kind;
    this.listRefs = ViewDto.buildListRefs(raw);
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
    this.updatedAt = raw?.updatedAt instanceof Date ? raw.updatedAt.toISOString() : raw?.updatedAt;
  }

  private static buildListRefs(raw: any): Array<ViewListRefDto> {
    if (Array.isArray(raw?.listRefs) && raw.listRefs.length > 0) {
      return raw.listRefs.map((r: any) => new ViewListRefDto(r));
    }
    if (Array.isArray(raw?.listIds) && raw.listIds.length > 0) {
      const wsId = raw?.workspaceId;
      return raw.listIds.map(
        (l: any) =>
          new ViewListRefDto({ listId: l, workspaceId: wsId }),
      );
    }
    return [];
  }
}
