import type { Pin, CreatePinDto } from '@hule/types'
import { http } from '@/app/api/httpClient'

const base = (wsId: string) => `/api/workspaces/${encodeURIComponent(wsId)}/pins`

export interface IPinsRepo {
  list(wsId: string): Promise<Pin[]>
  create(wsId: string, dto: CreatePinDto): Promise<Pin>
  remove(wsId: string, id: string): Promise<void>
}

export const pinsHttpRepo: IPinsRepo = {
  list: (wsId) =>
    http<Pin[]>(base(wsId)),
  create: (wsId, dto) =>
    http<Pin>(base(wsId), { method: 'POST', body: JSON.stringify(dto) }),
  remove: (wsId, id) =>
    http<void>(`${base(wsId)}/${id}`, { method: 'DELETE' }),
}
