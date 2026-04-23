import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db.ts'
import { toDto, toOid } from '../dto.ts'
import {
  CreateListDto,
  UpdateListDto,
  IdParams,
  ObjectIdString,
  ReorderDto,
} from '../schemas.ts'

const ListsQuery = z.object({ spaceId: ObjectIdString })

export async function listsRoutes(app: FastifyInstance): Promise<void> {
  const col = () => db().collection('lists')

  app.get('/api/lists', async (req) => {
    const { spaceId } = ListsQuery.parse(req.query)
    const docs = await col()
      .find({ spaceId: toOid(spaceId) })
      .sort({ order: 1 })
      .toArray()
    return docs.map(toDto)
  })

  app.post('/api/lists', async (req, reply) => {
    const body = CreateListDto.parse(req.body)
    const spaceOid = toOid(body.spaceId)
    const space = await db().collection('spaces').findOne({ _id: spaceOid })
    if (!space) throw app.httpErrors.badRequest('Space not found')
    const last = await col().find({ spaceId: spaceOid }).sort({ order: -1 }).limit(1).next()
    const order = (last?.order ?? -1) + 1
    const now = new Date()
    const { insertedId } = await col().insertOne({
      spaceId: spaceOid,
      name: body.name,
      order,
      createdAt: now,
      updatedAt: now,
    })
    const doc = await col().findOne({ _id: insertedId })
    return reply.code(201).send(toDto(doc!))
  })

  app.patch('/api/lists/:id', async (req) => {
    const { id } = IdParams.parse(req.params)
    const patch = UpdateListDto.parse(req.body)
    const res = await col().findOneAndUpdate(
      { _id: toOid(id) },
      { $set: { ...patch, updatedAt: new Date() } },
      { returnDocument: 'after' },
    )
    if (!res) throw app.httpErrors.notFound('List not found')
    return toDto(res)
  })

  app.delete('/api/lists/:id', async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const oid = toOid(id)
    await Promise.all([
      col().deleteOne({ _id: oid }),
      db().collection('tasks').deleteMany({ listId: oid }),
    ])
    return reply.code(204).send()
  })

  app.post('/api/lists/reorder', async (req, reply) => {
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
