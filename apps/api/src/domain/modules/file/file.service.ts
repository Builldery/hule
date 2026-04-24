import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { GridfsService } from '../../../adapters/gridfs/gridfs.service';

@Injectable()
export class FileService {
  constructor(private readonly gridfs: GridfsService) {}

  async getMeta(
    wsId: string,
    id: string,
  ): Promise<{ length: number; contentType?: string }> {
    const meta = await this.gridfs.findFileMeta(new ObjectId(id));
    if (!meta) throw new NotFoundException('File not found');
    this.assertWorkspaceMatch(meta.metadata, wsId);
    return { length: meta.length, contentType: meta.contentType };
  }

  async openDownloadStream(wsId: string, id: string) {
    const meta = await this.gridfs.findFileMeta(new ObjectId(id));
    if (!meta) throw new NotFoundException('File not found');
    this.assertWorkspaceMatch(meta.metadata, wsId);
    return this.gridfs.openDownloadStream(new ObjectId(id));
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.gridfs.deleteByMetadataWorkspaceId(wsOid as unknown as ObjectId);
  }

  private assertWorkspaceMatch(
    metadata: Record<string, unknown> | undefined,
    wsId: string,
  ): void {
    const metaWsId = metadata?.workspaceId;
    const asString =
      metaWsId instanceof ObjectId
        ? metaWsId.toHexString()
        : metaWsId instanceof Types.ObjectId
          ? metaWsId.toHexString()
          : typeof metaWsId === 'string'
            ? metaWsId
            : null;
    if (asString !== wsId) {
      throw new ForbiddenException('File does not belong to this workspace');
    }
  }
}
