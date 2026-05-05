import type { IsoDateString } from './common'

export type TagColor = 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple'

export interface Tag {
  id: string
  name: string
  color: TagColor
  createdAt: IsoDateString
  updatedAt: IsoDateString
}
