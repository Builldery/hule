import { z } from 'zod'
import { ObjectId } from 'mongodb'

export const ObjectIdString = z.string().refine(v => ObjectId.isValid(v), {
  message: 'Invalid ObjectId',
})

export const CreateSpaceDto = z.object({
  name: z.string().min(1).max(120),
  color: z.string().max(32).optional(),
})
export const UpdateSpaceDto = CreateSpaceDto.partial()
export type CreateSpaceDto = z.infer<typeof CreateSpaceDto>
export type UpdateSpaceDto = z.infer<typeof UpdateSpaceDto>

export const CreateListDto = z.object({
  spaceId: ObjectIdString,
  name: z.string().min(1).max(120),
})
export const UpdateListDto = z.object({
  name: z.string().min(1).max(120).optional(),
})
export type CreateListDto = z.infer<typeof CreateListDto>
export type UpdateListDto = z.infer<typeof UpdateListDto>

export const ReorderDto = z.array(z.object({
  id: ObjectIdString,
  order: z.number().int().nonnegative(),
})).min(1)
export type ReorderDto = z.infer<typeof ReorderDto>

export const IdParams = z.object({ id: ObjectIdString })

export const TaskStatus = z.string().min(1).max(40)
export const TaskPriority = z.enum(['none', 'low', 'normal', 'high', 'urgent'])

export const CreateTaskDto = z.object({
  listId: ObjectIdString,
  parentId: ObjectIdString.nullish(),
  title: z.string().min(1).max(500),
  description: z.string().max(20000).optional(),
  status: TaskStatus.default('todo'),
  priority: TaskPriority.default('none'),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
})
export type CreateTaskDto = z.infer<typeof CreateTaskDto>

export const UpdateTaskDto = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(20000).nullable().optional(),
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
})
export type UpdateTaskDto = z.infer<typeof UpdateTaskDto>

export const MoveTaskDto = z.object({
  listId: ObjectIdString.optional(),
  parentId: ObjectIdString.nullable().optional(),
  order: z.number().int().nonnegative(),
})
export type MoveTaskDto = z.infer<typeof MoveTaskDto>

export const TasksListQuery = z.object({
  listId: ObjectIdString,
  includeSubtasks: z.enum(['true', 'false']).default('false'),
})

export const TimelineQuery = z.object({
  spaceId: ObjectIdString.optional(),
  listId: ObjectIdString.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})
