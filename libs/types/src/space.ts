import type { IsoDateString } from './common'

export type SpaceShareRole = 'viewer' | 'editor'

export interface SpaceShareEntry {
  userId: string
  role: SpaceShareRole
}

export interface Space {
  id: string
  workspaceId: string
  name: string
  color?: string
  iconName?: string
  order: number
  sharedWith: SpaceShareEntry[]
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

export interface ShareSpaceDto {
  email: string
  role?: SpaceShareRole
}

export interface SharedSpaceOwner {
  id: string
  name: string
  email: string
}

export interface SharedSpace {
  space: Space
  lists: import('./list').List[]
  owner: SharedSpaceOwner
  role: SpaceShareRole
}
