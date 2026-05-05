import type { ICommentsRepo } from '@/app/api/IRepo'
import type { Comment } from '@hule/types'
import { http } from '@/app/api/httpClient'

const wsBase = (wsId: string) => `/api/workspaces/${encodeURIComponent(wsId)}`

export const commentsHttpRepo: ICommentsRepo = {
  listForTask: (wsId, taskId) =>
    http<Comment[]>(`${wsBase(wsId)}/tasks/${taskId}/comments`),

  create: (wsId, taskId, dto) => {
    const fd = new FormData()
    if (dto.body) fd.append('body', dto.body)
    for (const f of dto.files ?? []) fd.append('files', f, f.name)
    return http<Comment>(`${wsBase(wsId)}/tasks/${taskId}/comments`, { method: 'POST', body: fd })
  },

  update: (wsId, id, patch) =>
    http<Comment>(`${wsBase(wsId)}/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  remove: (wsId, id) =>
    http<void>(`${wsBase(wsId)}/comments/${id}`, { method: 'DELETE' }),
}
