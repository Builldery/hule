import type { Repo } from './IRepo'
import { spacesHttpRepo } from './http/spaces'
import { listsHttpRepo } from './http/lists'
import { tasksHttpRepo } from './http/tasks'
import { commentsHttpRepo } from './http/comments'

export const repo: Repo = {
  spaces: spacesHttpRepo,
  lists: listsHttpRepo,
  tasks: tasksHttpRepo,
  comments: commentsHttpRepo,
}
