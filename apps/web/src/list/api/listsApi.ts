import type { IListsRepo } from '@/app/api/IRepo'
import type { List, ReorderItem, CreateListDto, UpdateListDto } from '@hule/types'
import { http } from '@/app/api/httpClient'

const base = (wsId: string) => `/api/workspaces/${encodeURIComponent(wsId)}/lists`

export const listsHttpRepo: IListsRepo = {
  listBySpace: (wsId, spaceId) =>
    http<List[]>(`${base(wsId)}?spaceId=${encodeURIComponent(spaceId)}`),
  create: (wsId, dto: CreateListDto) =>
    http<List>(base(wsId), { method: 'POST', body: JSON.stringify(dto) }),
  update: (wsId, id, patch: UpdateListDto) =>
    http<List>(`${base(wsId)}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (wsId, id) =>
    http<void>(`${base(wsId)}/${id}`, { method: 'DELETE' }),
  reorder: (wsId, items: ReorderItem[]) =>
    http<void>(`${base(wsId)}/reorder`, { method: 'POST', body: JSON.stringify(items) }),
}
