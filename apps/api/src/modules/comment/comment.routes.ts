import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'
import { Readable } from 'node:stream'
import { db, bucket } from '../../db.ts'
import { toDto, toOid } from '../../shared/dto.ts'
import { IdParams } from '../../shared/validation.ts'

interface CommentDoc {
  _id: ObjectId
  taskId: ObjectId
  kind: 'comment' | 'activity'
  body?: string
  activity?: { type: string; meta: unknown }
  attachments: Array<{ fileId: ObjectId; filename: string; mime: string; size: number }>
  createdAt: Date
}

function serialize(doc: CommentDoc): Record<string, unknown> {
  return {
    ...toDto(doc),
    taskId: doc.taskId.toString(),
    attachments: doc.attachments.map(a => ({
      fileId: a.fileId.toString(),
      filename: a.filename,
      mime: a.mime,
      size: a.size,
    })),
    createdAt: doc.createdAt.toISOString(),
  }
}

export async function commentsRoutes(app: FastifyInstance): Promise<void> {
  const col = () => db().collection<CommentDoc>('comments')

  app.get('/api/tasks/:id/comments', async (req) => {
    const { id } = IdParams.parse(req.params)
    const docs = await col()
      .find({ taskId: toOid(id) })
      .sort({ createdAt: 1 })
      .toArray()
    return docs.map(serialize)
  })

  app.post('/api/tasks/:id/comments', async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const taskOid = toOid(id)
    const task = await db().collection('tasks').findOne({ _id: taskOid })
    if (!task) throw app.httpErrors.notFound('Task not found')

    let body: string | undefined
    const attachments: CommentDoc['attachments'] = []

    if (req.isMultipart()) {
      for await (const part of req.parts()) {
        if (part.type === 'field') {
          if (part.fieldname === 'body' && typeof part.value === 'string') {
            body = part.value
          }
        } else if (part.type === 'file') {
          const chunks: Buffer[] = []
          for await (const c of part.file) chunks.push(c as Buffer)
          const buf = Buffer.concat(chunks)
          const fileId = await new Promise<ObjectId>((resolve, reject) => {
            const uploadStream = bucket().openUploadStream(part.filename, {
              contentType: part.mimetype,
            })
            Readable.from(buf).pipe(uploadStream)
              .on('error', reject)
              .on('finish', () => resolve(uploadStream.id as ObjectId))
          })
          attachments.push({
            fileId,
            filename: part.filename,
            mime: part.mimetype,
            size: buf.length,
          })
        }
      }
    } else {
      const parsed = req.body as { body?: string } | null
      body = parsed?.body
    }

    if (!body && attachments.length === 0) {
      throw app.httpErrors.badRequest('Comment must have body or attachments')
    }

    const doc: CommentDoc = {
      _id: new ObjectId(),
      taskId: taskOid,
      kind: 'comment',
      body,
      attachments,
      createdAt: new Date(),
    }
    await col().insertOne(doc)
    return reply.code(201).send(serialize(doc))
  })

  app.delete('/api/comments/:id', async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const oid = toOid(id)
    const doc = await col().findOne({ _id: oid })
    if (!doc) return reply.code(204).send()
    await Promise.all([
      col().deleteOne({ _id: oid }),
      ...doc.attachments.map(a =>
        bucket().delete(a.fileId).catch(() => undefined),
      ),
    ])
    return reply.code(204).send()
  })
}
