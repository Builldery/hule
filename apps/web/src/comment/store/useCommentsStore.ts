import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Comment } from '@hule/types'
import { repo } from '@/app/api'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'

export const useCommentsStore = defineStore('comments', () => {
  const byTask = ref<Record<string, Comment[]>>({})
  const loadingTasks = ref<Set<string>>(new Set())

  function wsId(): string {
    return useWorkspacesStore().requireCurrentId()
  }

  function getForTask(taskId: string): Comment[] {
    return byTask.value[taskId] ?? []
  }

  async function loadForTask(taskId: string, force = false): Promise<void> {
    if (byTask.value[taskId] && !force) return
    if (loadingTasks.value.has(taskId)) return
    loadingTasks.value.add(taskId)
    try {
      const list = await repo.comments.listForTask(wsId(), taskId)
      byTask.value = { ...byTask.value, [taskId]: list }
    } finally {
      loadingTasks.value.delete(taskId)
    }
  }

  async function create(taskId: string, dto: { body?: string; files?: File[] }): Promise<Comment> {
    const created = await repo.comments.create(wsId(), taskId, dto)
    const cur = byTask.value[taskId] ?? []
    byTask.value = { ...byTask.value, [taskId]: [...cur, created] }
    return created
  }

  async function remove(commentId: string, taskId: string): Promise<void> {
    await repo.comments.remove(wsId(), commentId)
    byTask.value = {
      ...byTask.value,
      [taskId]: (byTask.value[taskId] ?? []).filter(c => c.id !== commentId),
    }
  }

  function reset(): void {
    byTask.value = {}
    loadingTasks.value = new Set()
  }

  return { byTask, getForTask, loadForTask, create, remove, reset }
})
