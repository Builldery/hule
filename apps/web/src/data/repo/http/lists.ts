import type { IListsRepo } from '../IRepo'
import type { List, ReorderItem, CreateListDto, UpdateListDto } from '../../types'
import { http } from './client'

export const listsHttpRepo: IListsRepo = {
  listBySpace: (spaceId: string) =>
    http<List[]>(`/api/lists?spaceId=${encodeURIComponent(spaceId)}`),
  create: (dto: CreateListDto) =>
    http<List>('/api/lists', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, patch: UpdateListDto) =>
    http<List>(`/api/lists/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => http<void>(`/api/lists/${id}`, { method: 'DELETE' }),
  reorder: (items: ReorderItem[]) =>
    http<void>('/api/lists/reorder', { method: 'POST', body: JSON.stringify(items) }),
}
