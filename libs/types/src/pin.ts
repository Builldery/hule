import type { IsoDateString } from './common'

export type PinEntity = 'list' | 'space' | 'view'

export interface Pin {
  id: string
  workspaceId: string
  userId: string | null
  label: string
  iconName?: string
  order: number
  entity: PinEntity
  entityId: string
  entityWorkspaceId: string | null
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export interface CreatePinDto {
  label: string
  iconName?: string
  entity: PinEntity
  entityId: string
  entityWorkspaceId?: string
}

export interface UpdatePinDto {
  label?: string
  iconName?: string
}
