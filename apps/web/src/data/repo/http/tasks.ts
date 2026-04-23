import type { ITasksRepo, CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '../IRepo'
import type { Task } from '../../types'
import { http } from './client'

function qs(params: Record<string, string | boolean | undefined>): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

export const tasksHttpRepo: ITasksRepo = {
  listByList: (listId, opts) =>
    http<Task[]>(`/api/tasks${qs({ listId, includeSubtasks: opts?.includeSubtasks })}`),

  get: (id) => http<Task>(`/api/tasks/${id}`),
  getSubtree: (id) => http<Task[]>(`/api/tasks/${id}/subtree`),

  create: (dto: CreateTaskDto) =>
    http<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id, patch: UpdateTaskDto) =>
    http<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  move: (id, dto: MoveTaskDto) =>
    http<void>(`/api/tasks/${id}/move`, { method: 'POST', body: JSON.stringify(dto) }),

  remove: (id) => http<void>(`/api/tasks/${id}`, { method: 'DELETE' }),

  timeline: (opts) => http<Task[]>(`/api/tasks/timeline${qs(opts)}`),
}
