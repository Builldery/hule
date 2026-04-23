import { z } from 'zod'

export const CreateSpaceDto = z.object({
  name: z.string().min(1).max(120),
  color: z.string().max(32).optional(),
})
export const UpdateSpaceDto = CreateSpaceDto.partial()
export type CreateSpaceDto = z.infer<typeof CreateSpaceDto>
export type UpdateSpaceDto = z.infer<typeof UpdateSpaceDto>
