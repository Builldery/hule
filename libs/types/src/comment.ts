import type { IsoDateString } from './common'

export interface Attachment {
  fileId: string
  filename: string
  mime: string
  size: number
}

export interface Comment {
  id: string
  taskId: string
  kind: 'comment' | 'activity'
  body?: string
  activity?: { type: string; meta: unknown }
  attachments: Attachment[]
  createdAt: IsoDateString
}
