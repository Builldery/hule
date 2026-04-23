import type { FastifyInstance } from 'fastify'
import { db } from '../../db.ts'
import { toDto, toOid } from '../../shared/dto.ts'
import { IdParams, ReorderDto } from '../../shared/validation.ts'
import { CreateSpaceDto, UpdateSpaceDto } from './space.schema.ts'

export async function spacesRoutes(app: FastifyInstance): Promise<void> {
  const col = () => db().collection('spaces')

  app.get('/api/spaces', async () => {
    const docs = await col().find().sort({ order: 1 }).toArray()
    return docs.map(toDto)
  })

  app.post('/api/spaces', async (req, reply) => {
    const body = CreateSpaceDto.parse(req.body)
    const last = await col().find().sort({ order: -1 }).limit(1).next()
    const order = (last?.order ?? -1) + 1
    const now = new Date()
    const { insertedId } = await col().insertOne({ ...body, order, createdAt: now, updatedAt: now })
    const doc = await col().findOne({ _id: insertedId })
    return reply.code(201).send(toDto(doc!))
  })

  app.patch('/api/spaces/:id', async (req) => {
    const { id } = IdParams.parse(req.params)
    const patch = UpdateSpaceDto.parse(req.body)
    const res = await col().findOneAndUpdate(
      { _id: toOid(id) },
      { $set: { ...patch, updatedAt: new Date() } },
      { returnDocument: 'after' },
    )
    if (!res) throw app.httpErrors.notFound('Space not found')
    return toDto(res)
  })

  app.delete('/api/spaces/:id', async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const oid = toOid(id)
    const lists = await db().collection('lists').find({ spaceId: oid }).project({ _id: 1 }).toArray()
    const listIds = lists.map(l => l._id)
    await Promise.all([
      col().deleteOne({ _id: oid }),
      db().collection('lists').deleteMany({ spaceId: oid }),
      listIds.length > 0
        ? db().collection('tasks').deleteMany({ listId: { $in: listIds } })
        : Promise.resolve(),
    ])
    return reply.code(204).send()
  })

  app.post('/api/spaces/reorder', async (req, reply) => {
    const items = ReorderDto.parse(req.body)
    const ops = items.map(i => ({
      updateOne: {
        filter: { _id: toOid(i.id) },
        update: { $set: { order: i.order, updatedAt: new Date() } },
      },
    }))
    await col().bulkWrite(ops)
    return reply.code(204).send()
  })
}
