import type { ISpacesRepo } from '@/app/api/IRepo'
import type { Space, ReorderItem, CreateSpaceDto, UpdateSpaceDto } from '@hule/types'
import { http } from '@/app/api/httpClient'

const base = (wsId: string) => `/api/workspaces/${encodeURIComponent(wsId)}/spaces`

export const spacesHttpRepo: ISpacesRepo = {
  list: (wsId) => http<Space[]>(base(wsId)),
  create: (wsId, dto: CreateSpaceDto) =>
    http<Space>(base(wsId), { method: 'POST', body: JSON.stringify(dto) }),
  update: (wsId, id: string, patch: UpdateSpaceDto) =>
    http<Space>(`${base(wsId)}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (wsId, id: string) =>
    http<void>(`${base(wsId)}/${id}`, { method: 'DELETE' }),
  reorder: (wsId, items: ReorderItem[]) =>
    http<void>(`${base(wsId)}/reorder`, { method: 'POST', body: JSON.stringify(items) }),
}
