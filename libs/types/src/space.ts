import type { IsoDateString } from './common'

export interface Space {
  id: string
  name: string
  color?: string
  iconName?: string
  order: number
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

export interface CreateSpaceDto {
  name: string
  color?: string
  iconName?: string
}

export interface UpdateSpaceDto {
  name?: string
  color?: string
  iconName?: string
}
