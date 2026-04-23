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
import { CommentDto } from '../../entity/comment/comment.dto';

function toOid(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

@Injectable()
export class CommentService {
  @InjectModel(Comment.name) private commentModel: Model<CommentDocument>;
  @InjectModel(Task.name) private taskModel: Model<Task>;

  constructor(private readonly gridfs: GridfsService) {}

  async getByTaskId(taskId: string): Promise<Array<CommentDto>> {
    const docs = await this.commentModel
      .find({ taskId: toOid(taskId) })
      .sort({ createdAt: 1 });
    return (docs ?? []).map((d) => new CommentDto(d));
  }

  async createForTask(taskId: string, req: FastifyRequest): Promise<CommentDto> {
    const taskOid = toOid(taskId);
    const task = await this.taskModel.findById(taskOid);
    if (!task) throw new NotFoundException('Task not found');

    let body: string | undefined;
    const attachments: Array<{
      fileId: Types.ObjectId;
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
          const fileId = await this.gridfs.upload(part.filename, part.mimetype, buf);
          attachments.push({
            fileId: fileId as unknown as Types.ObjectId,
            filename: part.filename,
            mime: part.mimetype,
            size: buf.length,
          });
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
      taskId: taskOid,
      kind: 'comment',
      body,
      attachments,
    });
    return new CommentDto(created);
  }

  async delete(id: string): Promise<void> {
    const oid = toOid(id);
    const doc = await this.commentModel.findById(oid);
    if (!doc) return;
    await this.commentModel.deleteOne({ _id: oid });
    await Promise.all(
      (doc.attachments ?? []).map((a) =>
        this.gridfs.delete(a.fileId as unknown as import('mongodb').ObjectId),
      ),
    );
  }
}
