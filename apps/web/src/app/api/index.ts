import type { Repo } from './IRepo'
import { spacesHttpRepo } from '@/space/api/spacesApi'
import { listsHttpRepo } from '@/list/api/listsApi'
import { tasksHttpRepo } from '@/task/api/tasksApi'
import { commentsHttpRepo } from '@/comment/api/commentsApi'
import { tagsHttpRepo } from '@/tag/api/tagsApi'
import { viewsHttpRepo } from '@/view/api/viewsApi'
import { pinsHttpRepo } from '@/pin/api/pinsApi'

export const repo: Repo = {
  spaces: spacesHttpRepo,
  lists: listsHttpRepo,
  tasks: tasksHttpRepo,
  comments: commentsHttpRepo,
  tags: tagsHttpRepo,
  views: viewsHttpRepo,
  pins: pinsHttpRepo,
}
