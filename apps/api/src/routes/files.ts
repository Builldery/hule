import type { FastifyInstance } from 'fastify'
import { toOid } from '../dto.ts'
import { bucket, db } from '../db.ts'
import { IdParams } from '../schemas.ts'

export async function filesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/files/:id', async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const oid = toOid(id)
    const fileDoc = await db().collection('attachments.files').findOne({ _id: oid })
    if (!fileDoc) throw app.httpErrors.notFound('File not found')
    reply.header('Content-Type', fileDoc.contentType ?? 'application/octet-stream')
    reply.header('Content-Length', String(fileDoc.length))
    reply.header('Cache-Control', 'public, max-age=31536000, immutable')
    return reply.send(bucket().openDownloadStream(oid))
  })
}
