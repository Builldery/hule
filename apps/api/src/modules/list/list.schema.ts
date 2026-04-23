import { z } from 'zod'
import { ObjectIdString } from '../../shared/validation.ts'

export const CreateListDto = z.object({
  spaceId: ObjectIdString,
  name: z.string().min(1).max(120),
})
export const UpdateListDto = z.object({
  name: z.string().min(1).max(120).optional(),
})
export type CreateListDto = z.infer<typeof CreateListDto>
export type UpdateListDto = z.infer<typeof UpdateListDto>
