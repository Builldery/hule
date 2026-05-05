import type {
  Space, List, Task, Tag, TagColor, Comment,
  CreateSpaceDto, UpdateSpaceDto, CreateListDto, UpdateListDto, ReorderItem,
} from '@hule/types'

export interface CreateTaskDto {
  listId: string
  parentId?: string | null
  title: string
  description?: string
  status?: string
  priority?: string
  startDate?: string
  dueDate?: string
  tagIds?: string[]
}

export interface UpdateTaskDto {
  title?: string
  description?: string | null
  status?: string
  priority?: string
  startDate?: string | null
  dueDate?: string | null
  tagIds?: string[]
}

export interface CreateTagDto {
  name: string
  color?: TagColor
}

export interface UpdateTagDto {
  name?: string
  color?: TagColor
}

export interface MoveTaskDto {
  listId?: string
  parentId?: string | null
  order: number
}

export interface TimelineQuery {
  spaceId?: string
  listId?: string
  from?: string
  to?: string
}

export interface ISpacesRepo {
  list(wsId: string): Promise<Space[]>
  create(wsId: string, dto: CreateSpaceDto): Promise<Space>
  update(wsId: string, id: string, patch: UpdateSpaceDto): Promise<Space>
  remove(wsId: string, id: string): Promise<void>
  reorder(wsId: string, items: ReorderItem[]): Promise<void>
}

export interface IListsRepo {
  listBySpace(wsId: string, spaceId: string): Promise<List[]>
  create(wsId: string, dto: CreateListDto): Promise<List>
  update(wsId: string, id: string, patch: UpdateListDto): Promise<List>
  remove(wsId: string, id: string): Promise<void>
  reorder(wsId: string, items: ReorderItem[]): Promise<void>
}

export interface ITasksRepo {
  listByList(wsId: string, listId: string, opts?: { includeSubtasks?: boolean }): Promise<Task[]>
  get(wsId: string, id: string): Promise<Task>
  getSubtree(wsId: string, id: string): Promise<Task[]>
  create(wsId: string, dto: CreateTaskDto): Promise<Task>
  update(wsId: string, id: string, patch: UpdateTaskDto): Promise<Task>
  move(wsId: string, id: string, dto: MoveTaskDto): Promise<void>
  remove(wsId: string, id: string): Promise<void>
  timeline(wsId: string, opts: TimelineQuery): Promise<Task[]>
}

export interface ICommentsRepo {
  listForTask(wsId: string, taskId: string): Promise<Comment[]>
  create(wsId: string, taskId: string, dto: { body?: string; files?: File[] }): Promise<Comment>
  update(wsId: string, id: string, patch: { body?: string }): Promise<Comment>
  remove(wsId: string, id: string): Promise<void>
}

export interface ITagsRepo {
  list(wsId: string): Promise<Tag[]>
  get(wsId: string, id: string): Promise<Tag>
  create(wsId: string, dto: CreateTagDto): Promise<Tag>
  update(wsId: string, id: string, patch: UpdateTagDto): Promise<Tag>
  remove(wsId: string, id: string): Promise<void>
}

export interface Repo {
  spaces: ISpacesRepo
  lists: IListsRepo
  tasks: ITasksRepo
  comments: ICommentsRepo
  tags: ITagsRepo
}
