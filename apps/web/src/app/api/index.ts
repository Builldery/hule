import type { Repo } from './IRepo'
import { spacesHttpRepo } from '@/space/api/spacesApi'
import { listsHttpRepo } from '@/list/api/listsApi'
import { tasksHttpRepo } from '@/task/api/tasksApi'
import { commentsHttpRepo } from '@/comment/api/commentsApi'

export const repo: Repo = {
  spaces: spacesHttpRepo,
  lists: listsHttpRepo,
  tasks: tasksHttpRepo,
  comments: commentsHttpRepo,
}
