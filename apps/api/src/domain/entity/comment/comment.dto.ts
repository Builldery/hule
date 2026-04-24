import { ApiProperty } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty() storageKey: string;
  @ApiProperty() filename: string;
  @ApiProperty() mime: string;
  @ApiProperty() size: number;

  constructor(raw: AttachmentDto | any) {
    this.storageKey = raw?.storageKey ?? '';
    this.filename = raw?.filename;
    this.mime = raw?.mime;
    this.size = raw?.size;
  }
}

export class CommentDto {
  @ApiProperty() id: string;
  @ApiProperty() taskId: string;
  @ApiProperty({ enum: ['comment', 'activity'] }) kind: 'comment' | 'activity';
  @ApiProperty({ required: false }) body?: string;
  @ApiProperty({ type: [AttachmentDto] }) attachments: Array<AttachmentDto>;
  @ApiProperty() createdAt: string;

  constructor(raw: CommentDto | any) {
    this.id = raw?._id?.toString() ?? raw?.id?.toString();
    this.taskId = raw?.taskId?.toString();
    this.kind = raw?.kind ?? 'comment';
    this.body = raw?.body;
    this.attachments = Array.isArray(raw?.attachments)
      ? raw.attachments.map((a: any) => new AttachmentDto(a))
      : [];
    this.createdAt = raw?.createdAt instanceof Date ? raw.createdAt.toISOString() : raw?.createdAt;
  }
}
