import type { IsoDateString } from './common'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | string
export type TaskPriority = 'none' | 'low' | 'normal' | 'high' | 'urgent'

export interface Task {
  id: string
  listId: string
  parentId: string | null
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  startDate?: IsoDateString
  dueDate?: IsoDateString
  order: number
  depth: number
  path: string[]
  tagIds: string[]
  createdAt: IsoDateString
  updatedAt: IsoDateString
}
