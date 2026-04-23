import { ObjectId, type Document } from 'mongodb'

export type WithId<T> = T & { _id: ObjectId }

export function toDto<T extends Document>(doc: WithId<T>): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc
  return { id: _id.toString(), ...(rest as Omit<T, '_id'>) }
}

export function toOid(id: string): ObjectId {
  return new ObjectId(id)
}
