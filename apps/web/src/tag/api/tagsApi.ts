import type { ITagsRepo, CreateTagDto, UpdateTagDto } from '@/app/api/IRepo'
import type { Tag } from '@hule/types'
import { http } from '@/app/api/httpClient'

const base = (wsId: string) => `/api/workspaces/${encodeURIComponent(wsId)}/tags`

export const tagsHttpRepo: ITagsRepo = {
  list: (wsId) => http<Tag[]>(base(wsId)),

  get: (wsId, id) => http<Tag>(`${base(wsId)}/${id}`),

  create: (wsId, dto: CreateTagDto) =>
    http<Tag>(base(wsId), { method: 'POST', body: JSON.stringify(dto) }),

  update: (wsId, id, patch: UpdateTagDto) =>
    http<Tag>(`${base(wsId)}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  remove: (wsId, id) => http<void>(`${base(wsId)}/${id}`, { method: 'DELETE' }),
}
