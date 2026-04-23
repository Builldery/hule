import type {
  Space, List, Task, Comment,
  CreateSpaceDto, UpdateSpaceDto, CreateListDto, UpdateListDto, ReorderItem,
} from '../types'

export interface CreateTaskDto {
  listId: string
  parentId?: string | null
  title: string
  description?: string
  status?: string
  priority?: string
  startDate?: string
  dueDate?: string
}

export interface UpdateTaskDto {
  title?: string
  description?: string | null
  status?: string
  priority?: string
  startDate?: string | null
  dueDate?: string | null
}

export interface MoveTaskDto {
  listId?: string
  parentId?: string | null
  order: number
}

export interface ISpacesRepo {
  list(): Promise<Space[]>
  create(dto: CreateSpaceDto): Promise<Space>
  update(id: string, patch: UpdateSpaceDto): Promise<Space>
  remove(id: string): Promise<void>
  reorder(items: ReorderItem[]): Promise<void>
}

export interface IListsRepo {
  listBySpace(spaceId: string): Promise<List[]>
  create(dto: CreateListDto): Promise<List>
  update(id: string, patch: UpdateListDto): Promise<List>
  remove(id: string): Promise<void>
  reorder(items: ReorderItem[]): Promise<void>
}

export interface ITasksRepo {
  listByList(listId: string, opts?: { includeSubtasks?: boolean }): Promise<Task[]>
  get(id: string): Promise<Task>
  getSubtree(id: string): Promise<Task[]>
  create(dto: CreateTaskDto): Promise<Task>
  update(id: string, patch: UpdateTaskDto): Promise<Task>
  move(id: string, dto: MoveTaskDto): Promise<void>
  remove(id: string): Promise<void>
  timeline(opts: { spaceId?: string; listId?: string; from?: string; to?: string }): Promise<Task[]>
}

export interface ICommentsRepo {
  listForTask(taskId: string): Promise<Comment[]>
  create(taskId: string, dto: { body?: string; files?: File[] }): Promise<Comment>
  remove(id: string): Promise<void>
}

export interface Repo {
  spaces: ISpacesRepo
  lists: IListsRepo
  tasks: ITasksRepo
  comments: ICommentsRepo
}
