import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { GridfsService } from '../../../adapters/gridfs/gridfs.service';
import { R2Service } from '../../../adapters/r2/r2.service';

@Injectable()
export class FileService {
  constructor(
    private readonly gridfs: GridfsService,
    private readonly r2: R2Service,
  ) {}

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

  async getR2PresignedUrl(wsId: string, key: string): Promise<string> {
    if (!this.r2.isConfigured()) {
      throw new NotFoundException('R2 storage not configured');
    }
    if (!key.startsWith(`${wsId}/`)) {
      throw new ForbiddenException('File does not belong to this workspace');
    }
    const meta = await this.r2.findFileMeta(key);
    if (!meta) throw new NotFoundException('File not found');
    return this.r2.presignedGetUrl(key);
  }

  async deleteByWorkspaceId(wsOid: Types.ObjectId): Promise<void> {
    await this.gridfs.deleteByMetadataWorkspaceId(wsOid as unknown as ObjectId);
    if (this.r2.isConfigured()) {
      await this.r2.deleteByWorkspaceId(wsOid.toHexString());
    }
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
