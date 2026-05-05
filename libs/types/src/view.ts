import type { IsoDateString } from './common'

export type ViewKind = 'kanban' | 'list' | 'timeline'

export interface View {
  id: string
  label: string
  kind: ViewKind
  listIds: string[]
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export interface CreateViewDto {
  label: string
  kind: ViewKind
  listIds?: string[]
}

export interface UpdateViewDto {
  label?: string
  kind?: ViewKind
  listIds?: string[]
}
