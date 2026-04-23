import { MongoClient, GridFSBucket, type Db } from 'mongodb'

const url = process.env.MONGO_URL ?? 'mongodb://mongo:27017/hule'

const client = new MongoClient(url)
let dbInstance: Db | null = null
let bucketInstance: GridFSBucket | null = null

export async function connectDb(): Promise<Db> {
  if (dbInstance) return dbInstance
  await client.connect()
  dbInstance = client.db()
  bucketInstance = new GridFSBucket(dbInstance, { bucketName: 'attachments' })
  await ensureIndexes(dbInstance)
  return dbInstance
}

export function db(): Db {
  if (!dbInstance) throw new Error('DB not connected — call connectDb() first')
  return dbInstance
}

export function bucket(): GridFSBucket {
  if (!bucketInstance) throw new Error('GridFS bucket not ready — call connectDb() first')
  return bucketInstance
}

async function ensureIndexes(d: Db): Promise<void> {
  await Promise.all([
    d.collection('lists').createIndex({ spaceId: 1, order: 1 }),
    d.collection('tasks').createIndex({ listId: 1, parentId: 1, order: 1 }),
    d.collection('tasks').createIndex({ parentId: 1 }),
    d.collection('tasks').createIndex({ path: 1 }),
    d.collection('tasks').createIndex({ startDate: 1, dueDate: 1 }),
    d.collection('comments').createIndex({ taskId: 1, createdAt: 1 }),
  ])
}

export async function closeDb(): Promise<void> {
  await client.close()
  dbInstance = null
  bucketInstance = null
}
