import type { IsoDateString } from './common'

export interface List {
  id: string
  workspaceId: string
  spaceId: string
  name: string
  iconName?: string
  order: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export interface CreateListDto {
  spaceId: string
  name: string
  iconName?: string
}

export interface UpdateListDto {
  name?: string
  iconName?: string
}
