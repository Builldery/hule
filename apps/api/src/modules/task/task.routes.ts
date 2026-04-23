import type { FastifyInstance } from 'fastify'
import { ObjectId } from 'mongodb'
import { db } from '../../db.ts'
import { toDto, toOid } from '../../shared/dto.ts'
import { IdParams } from '../../shared/validation.ts'
import {
  CreateTaskDto,
  UpdateTaskDto,
  MoveTaskDto,
  TasksListQuery,
  TimelineQuery,
} from './task.schema.ts'

interface TaskDoc {
  _id: ObjectId
  listId: ObjectId
  parentId: ObjectId | null
  title: string
  description?: string
  status: string
  priority: string
  startDate?: Date
  dueDate?: Date
  order: number
  depth: number
  path: ObjectId[]
  createdAt: Date
  updatedAt: Date
}

function serialize(doc: TaskDoc): Record<string, unknown> {
  return {
    ...toDto(doc),
    listId: doc.listId.toString(),
    parentId: doc.parentId ? doc.parentId.toString() : null,
    path: doc.path.map(p => p.toString()),
    startDate: doc.startDate?.toISOString(),
    dueDate: doc.dueDate?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

async function nextOrder(
  listOid: ObjectId,
  parentOid: ObjectId | null,
): Promise<number> {
  const last = await db()
    .collection<TaskDoc>('tasks')
    .find({ listId: listOid, parentId: parentOid })
    .sort({ order: -1 })
    .limit(1)
    .next()
  return (last?.order ?? -1) + 1
}

export async function tasksRoutes(app: FastifyInstance): Promise<void> {
  const col = () => db().collection<TaskDoc>('tasks')

  app.get('/api/tasks', async (req) => {
    const { listId, includeSubtasks } = TasksListQuery.parse(req.query)
    const listOid = toOid(listId)
    const filter: Record<string, unknown> = { listId: listOid }
    if (includeSubtasks === 'false') filter.parentId = null
    const docs = await col().find(filter).sort({ order: 1 }).toArray()
    return docs.map(serialize)
  })

  app.get('/api/tasks/timeline', async (req) => {
    const { listId, spaceId, from, to } = TimelineQuery.parse(req.query)
    const filter: Record<string, unknown> = {
      startDate: { $exists: true, $ne: null },
      dueDate: { $exists: true, $ne: null },
    }
    if (listId) filter.listId = toOid(listId)
    else if (spaceId) {
      const listIds = await db()
        .collection('lists')
        .find({ spaceId: toOid(spaceId) })
        .project({ _id: 1 })
        .toArray()
      filter.listId = { $in: listIds.map(l => l._id) }
    }
    if (from || to) {
      const range: Record<string, Date> = {}
      if (from) range.$lte = new Date(to ?? from)
      if (to) range.$gte = new Date(from ?? to)
      filter.$and = [
        { startDate: { $lte: to ? new Date(to) : new Date('2999-01-01') } },
        { dueDate: { $gte: from ? new Date(from) : new Date('1970-01-01') } },
      ]
      void range
    }
    const docs = await col().find(filter).sort({ startDate: 1 }).toArray()
    return docs.map(serialize)
  })

  app.get('/api/tasks/:id', async (req) => {
    const { id } = IdParams.parse(req.params)
    const doc = await col().findOne({ _id: toOid(id) })
    if (!doc) throw app.httpErrors.notFound('Task not found')
    return serialize(doc)
  })

  app.get('/api/tasks/:id/subtree', async (req) => {
    const { id } = IdParams.parse(req.params)
    const oid = toOid(id)
    const root = await col().findOne({ _id: oid })
    if (!root) throw app.httpErrors.notFound('Task not found')
    const descendants = await col().find({ path: oid }).sort({ depth: 1, order: 1 }).toArray()
    return [root, ...descendants].map(serialize)
  })

  app.post('/api/tasks', async (req, reply) => {
    const body = CreateTaskDto.parse(req.body)
    const listOid = toOid(body.listId)
    const list = await db().collection('lists').findOne({ _id: listOid })
    if (!list) throw app.httpErrors.badRequest('List not found')

    let parentOid: ObjectId | null = null
    let depth = 0
    let path: ObjectId[] = []
    if (body.parentId) {
      parentOid = toOid(body.parentId)
      const parent = await col().findOne({ _id: parentOid })
      if (!parent) throw app.httpErrors.badRequest('Parent task not found')
      depth = parent.depth + 1
      path = [...parent.path, parent._id]
    }

    const order = await nextOrder(listOid, parentOid)
    const now = new Date()
    const insert: TaskDoc = {
      _id: new ObjectId(),
      listId: listOid,
      parentId: parentOid,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      order,
      depth,
      path,
      createdAt: now,
      updatedAt: now,
    }
    await col().insertOne(insert)
    return reply.code(201).send(serialize(insert))
  })

  app.patch('/api/tasks/:id', async (req) => {
    const { id } = IdParams.parse(req.params)
    const patch = UpdateTaskDto.parse(req.body)
    const $set: Record<string, unknown> = { updatedAt: new Date() }
    const $unset: Record<string, ''> = {}
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) $unset[k] = ''
      else if (v !== undefined) {
        if (k === 'startDate' || k === 'dueDate') $set[k] = new Date(v as string)
        else $set[k] = v
      }
    }
    const update: Record<string, unknown> = { $set }
    if (Object.keys($unset).length) update.$unset = $unset
    const res = await col().findOneAndUpdate(
      { _id: toOid(id) },
      update,
      { returnDocument: 'after' },
    )
    if (!res) throw app.httpErrors.notFound('Task not found')
    return serialize(res)
  })

  app.post('/api/tasks/:id/move', async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const body = MoveTaskDto.parse(req.body)
    const oid = toOid(id)
    const task = await col().findOne({ _id: oid })
    if (!task) throw app.httpErrors.notFound('Task not found')

    let nextListOid = task.listId
    let nextParentOid: ObjectId | null = task.parentId
    let nextPath: ObjectId[] = task.path
    let nextDepth = task.depth

    const parentChanged = body.parentId !== undefined
    const listChanged = body.listId !== undefined && toOid(body.listId).toHexString() !== task.listId.toHexString()

    if (parentChanged) {
      if (body.parentId === null) {
        nextParentOid = null
        nextPath = []
        nextDepth = 0
      } else {
        const parentOid = toOid(body.parentId!)
        if (parentOid.toHexString() === oid.toHexString()) {
          throw app.httpErrors.badRequest('Task cannot be its own parent')
        }
        const parent = await col().findOne({ _id: parentOid })
        if (!parent) throw app.httpErrors.badRequest('Parent not found')
        if (parent.path.some(p => p.toHexString() === oid.toHexString())) {
          throw app.httpErrors.badRequest('Cannot move task under its own descendant')
        }
        nextParentOid = parentOid
        nextPath = [...parent.path, parent._id]
        nextDepth = parent.depth + 1
        nextListOid = parent.listId
      }
    }
    if (listChanged && !parentChanged) {
      nextListOid = toOid(body.listId!)
      nextParentOid = null
      nextPath = []
      nextDepth = 0
    } else if (listChanged && body.parentId === null) {
      nextListOid = toOid(body.listId!)
    }

    const now = new Date()
    await col().updateOne(
      { _id: oid },
      {
        $set: {
          listId: nextListOid,
          parentId: nextParentOid,
          path: nextPath,
          depth: nextDepth,
          order: body.order,
          updatedAt: now,
        },
      },
    )

    const pathChangedFromOriginal =
      nextPath.length !== task.path.length ||
      nextPath.some((p, i) => p.toHexString() !== task.path[i]?.toHexString()) ||
      nextListOid.toHexString() !== task.listId.toHexString()

    if (pathChangedFromOriginal) {
      const descendants = await col().find({ path: oid }).toArray()
      if (descendants.length > 0) {
        const ops = descendants.map(d => {
          const idxOfSelf = d.path.findIndex(p => p.toHexString() === oid.toHexString())
          const suffix = d.path.slice(idxOfSelf)
          const newPath = [...nextPath, ...suffix]
          const newDepth = newPath.length
          return {
            updateOne: {
              filter: { _id: d._id },
              update: {
                $set: {
                  path: newPath,
                  depth: newDepth,
                  listId: nextListOid,
                  updatedAt: now,
                },
              },
            },
          }
        })
        await col().bulkWrite(ops)
      }
    }

    return reply.code(204).send()
  })

  app.delete('/api/tasks/:id', async (req, reply) => {
    const { id } = IdParams.parse(req.params)
    const oid = toOid(id)
    await col().deleteMany({ $or: [{ _id: oid }, { path: oid }] })
    await db().collection('comments').deleteMany({ taskId: oid })
    return reply.code(204).send()
  })
}
