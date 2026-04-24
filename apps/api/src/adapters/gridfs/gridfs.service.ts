import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'node:stream';

@Injectable()
export class GridfsService implements OnModuleInit {
  private bucketInstance: GridFSBucket | null = null;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit(): void {
    if (!this.connection.db) {
      throw new Error('GridFS cannot init: mongoose connection has no db');
    }
    this.bucketInstance = new GridFSBucket(this.connection.db as any, {
      bucketName: 'attachments',
    });
  }

  private bucket(): GridFSBucket {
    if (!this.bucketInstance) throw new Error('GridFS bucket not ready');
    return this.bucketInstance;
  }

  upload(
    filename: string,
    mime: string,
    buffer: Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<ObjectId> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.bucket().openUploadStream(filename, {
        contentType: mime,
        metadata,
      });
      Readable.from(buffer)
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve(uploadStream.id as ObjectId));
    });
  }

  openDownloadStream(id: ObjectId) {
    return this.bucket().openDownloadStream(id);
  }

  async findFileMeta(
    id: ObjectId,
  ): Promise<{
    length: number;
    contentType?: string;
    metadata?: Record<string, unknown>;
  } | null> {
    if (!this.connection.db) return null;
    const doc = await this.connection.db
      .collection('attachments.files')
      .findOne({ _id: id as any });
    if (!doc) return null;
    return { length: doc.length, contentType: doc.contentType, metadata: doc.metadata };
  }

  async delete(id: ObjectId): Promise<void> {
    try {
      await this.bucket().delete(id);
    } catch {
      // swallow — file may already be gone; mirrors current behavior
    }
  }

  async deleteByMetadataWorkspaceId(workspaceId: ObjectId): Promise<void> {
    if (!this.connection.db) return;
    const files = await this.connection.db
      .collection('attachments.files')
      .find({ 'metadata.workspaceId': workspaceId as any })
      .project({ _id: 1 })
      .toArray();
    await Promise.all(files.map((f) => this.delete(f._id as unknown as ObjectId)));
  }
}
