import type { IsoDateString } from './common'

export interface Space {
  id: string
  name: string
  color?: string
  order: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export interface CreateSpaceDto {
  name: string
  color?: string
}

export interface UpdateSpaceDto {
  name?: string
  color?: string
}
