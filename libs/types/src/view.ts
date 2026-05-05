import type { IsoDateString } from './common'

export type ViewKind = 'kanban' | 'list' | 'timeline'

export interface ViewListRef {
  listId: string
  workspaceId: string
}

export interface View {
  id: string
  workspaceId: string
  userId: string | null
  label: string
  kind: ViewKind
  listRefs: ViewListRef[]
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export interface CreateViewDto {
  label: string
  kind: ViewKind
  listRefs?: ViewListRef[]
}

export interface UpdateViewDto {
  label?: string
  kind?: ViewKind
  listRefs?: ViewListRef[]
}
