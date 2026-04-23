import { z } from 'zod'
import { ObjectId } from 'mongodb'

export const ObjectIdString = z.string().refine(v => ObjectId.isValid(v), {
  message: 'Invalid ObjectId',
})

export const IdParams = z.object({ id: ObjectIdString })

export const ReorderDto = z.array(z.object({
  id: ObjectIdString,
  order: z.number().int().nonnegative(),
})).min(1)
export type ReorderDto = z.infer<typeof ReorderDto>
