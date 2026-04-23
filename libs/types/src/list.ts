import type { IsoDateString } from './common'

export interface List {
  id: string
  spaceId: string
  name: string
  order: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export interface CreateListDto {
  spaceId: string
  name: string
}

export interface UpdateListDto {
  name?: string
}
