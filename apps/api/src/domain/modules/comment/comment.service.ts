import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { FastifyRequest } from 'fastify';
import {
  Comment,
  CommentDocument,
} from '../../../adapters/mongo/comment.schema';
import { Task } from '../../../adapters/mongo/task.schema';
import { GridfsService } from '../../../adapters/gridfs/gridfs.service';
import { R2Service } from '../../../adapters/r2/r2.service';
import { CommentDto } from '../../entity/comment/comment.dto';
import { toOid } from '../../entity/common/to-oid';

@Injectable()
export class CommentService {
  @InjectModel(Comment.name) private commentModel: Model<CommentDocument>;
  @InjectModel(Task.name) private taskModel: Model<Task>;

  constructor(
    private readonly gridfs: GridfsService,
    private readonly r2: R2Service,
  ) {}

  async getByTaskId(wsId: string, taskId: string): Promise<Array<CommentDto>> {
    const wsOid = toOid(wsId);
    const docs = await this.commentModel
      .find({ workspaceId: wsOid, taskId: toOid(taskId) })
      .sort({ createdAt: 1 });
    return (docs ?? []).map((d) => new CommentDto(d));
  }

  async createForTask(
    wsId: string,
    taskId: string,
    req: FastifyRequest,
  ): Promise<CommentDto> {
    const wsOid = toOid(wsId);
    const taskOid = toOid(taskId);
    const task = await this.taskModel.findOne({
      _id: taskOid,
      workspaceId: wsOid,
    });
    if (!task) throw new NotFoundException('Task not found');

    let body: string | undefined;
    const attachments: Array<{
      fileId?: Types.ObjectId;
      storage?: 'gridfs' | 'r2';
      storageKey?: string;
      filename: string;
      mime: string;
      size: number;
    }> = [];

    if (req.isMultipart()) {
      for await (const part of req.parts()) {
        if (part.type === 'field') {
          if (part.fieldname === 'body' && typeof part.value === 'string') {
            body = part.value;
          }
        } else if (part.type === 'file') {
          const chunks: Array<Buffer> = [];
          for await (const c of part.file) chunks.push(c as Buffer);
          const buf = Buffer.concat(chunks);

          if (this.r2.isConfigured()) {
            const key = await this.r2.upload(
              part.filename,
              part.mimetype,
              buf,
              { workspaceId: wsOid.toHexString() },
            );
            attachments.push({
              storage: 'r2',
              storageKey: key,
              filename: part.filename,
              mime: part.mimetype,
              size: buf.length,
            });
          } else {
            const fileId = await this.gridfs.upload(
              part.filename,
              part.mimetype,
              buf,
              { workspaceId: wsOid },
            );
            attachments.push({
              storage: 'gridfs',
              fileId: fileId as unknown as Types.ObjectId,
              filename: part.filename,
              mime: part.mimetype,
              size: buf.length,
            });
          }
        }
      }
    } else {
      const parsed = req.body as { body?: string } | null;
      body = parsed?.body;
    }

    if (!body && attachments.length === 0) {
      throw new BadRequestException('Comment must have body or attachments');
    }

    const created = await this.commentModel.create({
      workspaceId: wsOid,
      taskId: taskOid,
      kind: 'comment',
      body,
      attachments,
    });
    return new CommentDto(created);
  }

  async update(
    wsId: string,
    id: string,
    dto: { body?: string },
  ): Promise<CommentDto> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const doc = await this.commentModel.findOne({ _id: oid, workspaceId: wsOid });
    if (!doc) throw new NotFoundException('Comment not found');

    const trimmed = dto.body?.trim();
    if (!trimmed && (doc.attachments?.length ?? 0) === 0) {
      throw new BadRequestException('Comment must have body or attachments');
    }
    doc.body = trimmed || undefined;
    await doc.save();
    return new CommentDto(doc);
  }

  async delete(wsId: string, id: string): Promise<void> {
    const wsOid = toOid(wsId);
    const oid = toOid(id);
    const doc = await this.commentModel.findOne({ _id: oid, workspaceId: wsOid });
    if (!doc) return;
    await this.commentModel.deleteOne({ _id: oid, workspaceId: wsOid });
    await Promise.all(
      (doc.attachments ?? []).map((a) => {
        if (a.storage === 'r2' && a.storageKey) {
          return this.r2.delete(a.storageKey);
        }
        if (a.fileId) {
          return this.gridfs.delete(
            a.fileId as unknown as import('mongodb').ObjectId,
          );
        }
        return Promise.resolve();
      }),
    );
  }
}
