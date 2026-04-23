import type { ICommentsRepo } from '@/app/api/IRepo'
import type { Comment } from '@hule/types'
import { http } from '@/app/api/httpClient'

export const commentsHttpRepo: ICommentsRepo = {
  listForTask: (taskId: string) => http<Comment[]>(`/api/tasks/${taskId}/comments`),

  create: (taskId: string, dto: { body?: string; files?: File[] }) => {
    const fd = new FormData()
    if (dto.body) fd.append('body', dto.body)
    for (const f of dto.files ?? []) fd.append('files', f, f.name)
    return http<Comment>(`/api/tasks/${taskId}/comments`, { method: 'POST', body: fd })
  },

  remove: (id: string) => http<void>(`/api/comments/${id}`, { method: 'DELETE' }),
}
