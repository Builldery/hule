export interface Space {
  id: string
  name: string
  color?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface List {
  id: string
  spaceId: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

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
  startDate?: string
  dueDate?: string
  order: number
  depth: number
  path: string[]
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  fileId: string
  filename: string
  mime: string
  size: number
}

export interface Comment {
  id: string
  taskId: string
  kind: 'comment' | 'activity'
  body?: string
  activity?: { type: string; meta: unknown }
  attachments: Attachment[]
  createdAt: string
}

export interface CreateSpaceDto { name: string; color?: string }
export interface UpdateSpaceDto { name?: string; color?: string }
export interface CreateListDto { spaceId: string; name: string }
export interface UpdateListDto { name?: string }
export interface ReorderItem { id: string; order: number }
