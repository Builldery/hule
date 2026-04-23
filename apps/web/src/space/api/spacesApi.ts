import type { ISpacesRepo } from '@/app/api/IRepo'
import type { Space, ReorderItem, CreateSpaceDto, UpdateSpaceDto } from '@hule/types'
import { http } from '@/app/api/httpClient'

export const spacesHttpRepo: ISpacesRepo = {
  list: () => http<Space[]>('/api/spaces'),
  create: (dto: CreateSpaceDto) => http<Space>('/api/spaces', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, patch: UpdateSpaceDto) =>
    http<Space>(`/api/spaces/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id: string) => http<void>(`/api/spaces/${id}`, { method: 'DELETE' }),
  reorder: (items: ReorderItem[]) =>
    http<void>('/api/spaces/reorder', { method: 'POST', body: JSON.stringify(items) }),
}
