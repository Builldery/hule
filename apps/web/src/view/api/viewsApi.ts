import type { View, CreateViewDto, UpdateViewDto } from '@hule/types'
import { http } from '@/app/api/httpClient'

const base = (wsId: string) => `/api/workspaces/${encodeURIComponent(wsId)}/views`

export interface IViewsRepo {
  list(wsId: string): Promise<View[]>
  getById(wsId: string, id: string): Promise<View>
  create(wsId: string, dto: CreateViewDto): Promise<View>
  update(wsId: string, id: string, patch: UpdateViewDto): Promise<View>
  remove(wsId: string, id: string): Promise<void>
}

export const viewsHttpRepo: IViewsRepo = {
  list: (wsId) =>
    http<View[]>(base(wsId)),
  getById: (wsId, id) =>
    http<View>(`${base(wsId)}/${id}`),
  create: (wsId, dto) =>
    http<View>(base(wsId), { method: 'POST', body: JSON.stringify(dto) }),
  update: (wsId, id, patch) =>
    http<View>(`${base(wsId)}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (wsId, id) =>
    http<void>(`${base(wsId)}/${id}`, { method: 'DELETE' }),
}
