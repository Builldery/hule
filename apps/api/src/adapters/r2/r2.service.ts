import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

export interface R2FileMeta {
  length: number;
  contentType?: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class R2Service implements OnModuleInit {
  private readonly logger = new Logger(R2Service.name);
  private client: S3Client | null = null;
  private bucketName: string | null = null;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      this.logger.log('R2 not configured — storage driver will fall back to GridFS');
      return;
    }

    this.bucketName = bucket;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.client || !this.bucketName) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      console.log(
        `\x1b[32m☁️ ☁️ R2 storage connected successfully to bucket "${this.bucketName}" ☁️ ☁️\x1b[0m`,
      );
    } catch (err) {
      this.logger.error(
        `R2 connection check failed for bucket "${this.bucketName}"`,
        err as Error,
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.bucketName !== null;
  }

  async upload(
    filename: string,
    mime: string,
    buffer: Buffer,
    metadata: { workspaceId: string; [k: string]: string },
  ): Promise<string> {
    const { client, bucket } = this.require();
    const safeName = filename.replace(/[^\w.\-]+/g, '_');
    const key = `${metadata.workspaceId}/${randomUUID()}-${safeName}`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
        Metadata: metadata,
      }),
    );
    return key;
  }

  async findFileMeta(key: string): Promise<R2FileMeta | null> {
    const { client, bucket } = this.require();
    try {
      const r = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
      );
      return {
        length: r.ContentLength ?? 0,
        contentType: r.ContentType,
        metadata: r.Metadata ?? {},
      };
    } catch {
      return null;
    }
  }

  async openDownloadStream(key: string): Promise<Readable> {
    const { client, bucket } = this.require();
    const r = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return r.Body as Readable;
  }

  async presignedGetUrl(key: string, expiresSec = 300): Promise<string> {
    const { client, bucket } = this.require();
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: expiresSec },
    );
  }

  async delete(key: string): Promise<void> {
    const { client, bucket } = this.require();
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      // swallow — mirrors GridFS delete behavior
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    const { client, bucket } = this.require();
    let continuationToken: string | undefined;
    do {
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `${workspaceId}/`,
          ContinuationToken: continuationToken,
        }),
      );
      if (list.Contents?.length) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: list.Contents.map((o) => ({ Key: o.Key! })) },
          }),
        );
      }
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  private require(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucketName) {
      throw new Error(
        'R2Service is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.',
      );
    }
    return { client: this.client, bucket: this.bucketName };
  }
}
