import type { ITasksRepo, CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '@/app/api/IRepo'
import type { Task } from '@hule/types'
import { http } from '@/app/api/httpClient'

const base = (wsId: string) => `/api/workspaces/${encodeURIComponent(wsId)}/tasks`

function qs(params: Record<string, unknown>): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
}

export const tasksHttpRepo: ITasksRepo = {
  listByList: (wsId, listId, opts) =>
    http<Task[]>(`${base(wsId)}${qs({ listId, includeSubtasks: opts?.includeSubtasks })}`),

  get: (wsId, id) => http<Task>(`${base(wsId)}/${id}`),

  getSubtree: (wsId, id) => http<Task[]>(`${base(wsId)}/${id}/subtree`),

  create: (wsId, dto: CreateTaskDto) =>
    http<Task>(base(wsId), { method: 'POST', body: JSON.stringify(dto) }),

  update: (wsId, id, patch: UpdateTaskDto) =>
    http<Task>(`${base(wsId)}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  move: (wsId, id, dto: MoveTaskDto) =>
    http<void>(`${base(wsId)}/${id}/move`, { method: 'POST', body: JSON.stringify(dto) }),

  remove: (wsId, id) => http<void>(`${base(wsId)}/${id}`, { method: 'DELETE' }),

  timeline: (wsId, opts) => http<Task[]>(`${base(wsId)}/timeline${qs({ ...opts })}`),
}
