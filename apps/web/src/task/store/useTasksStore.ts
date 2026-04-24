import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Task } from '@hule/types'
import type { CreateTaskDto, UpdateTaskDto, MoveTaskDto } from '@/app/api/IRepo'
import { repo } from '@/app/api'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'

export const useTasksStore = defineStore('tasks', () => {
  const byList = ref<Record<string, Task[]>>({})
  const subtrees = ref<Record<string, Task[]>>({})
  const loadingLists = ref<Set<string>>(new Set())

  const byId = computed<Record<string, Task>>(() => {
    const out: Record<string, Task> = {}
    for (const arr of Object.values(byList.value)) {
      for (const t of arr) out[t.id] = t
    }
    for (const arr of Object.values(subtrees.value)) {
      for (const t of arr) out[t.id] = t
    }
    return out
  })

  function wsId(): string {
    return useWorkspacesStore().requireCurrentId()
  }

  function getForList(listId: string): Task[] {
    return byList.value[listId] ?? []
  }

  function getSubtree(rootId: string): Task[] {
    return subtrees.value[rootId] ?? []
  }

  async function loadForList(listId: string, force = false): Promise<void> {
    if (byList.value[listId] && !force) return
    if (loadingLists.value.has(listId)) return
    loadingLists.value.add(listId)
    try {
      const arr = await repo.tasks.listByList(wsId(), listId, { includeSubtasks: true })
      byList.value = { ...byList.value, [listId]: arr }
    } finally {
      loadingLists.value.delete(listId)
    }
  }

  async function loadSubtree(rootId: string): Promise<void> {
    const arr = await repo.tasks.getSubtree(wsId(), rootId)
    subtrees.value = { ...subtrees.value, [rootId]: arr }
  }

  function upsertInList(task: Task): void {
    const cur = byList.value[task.listId] ?? []
    const exists = cur.some(t => t.id === task.id)
    const next = exists
      ? cur.map(t => (t.id === task.id ? task : t))
      : [...cur, task]
    byList.value = { ...byList.value, [task.listId]: next.sort(sortFn) }
  }

  function removeFromAll(id: string): void {
    for (const lid of Object.keys(byList.value)) {
      byList.value[lid] = byList.value[lid].filter(t => t.id !== id)
    }
    for (const root of Object.keys(subtrees.value)) {
      subtrees.value[root] = subtrees.value[root].filter(t => t.id !== id)
    }
    byList.value = { ...byList.value }
    subtrees.value = { ...subtrees.value }
  }

  async function create(dto: CreateTaskDto): Promise<Task> {
    const created = await repo.tasks.create(wsId(), dto)
    upsertInList(created)
    return created
  }

  async function update(id: string, patch: UpdateTaskDto): Promise<Task> {
    const updated = await repo.tasks.update(wsId(), id, patch)
    upsertInList(updated)
    return updated
  }

  async function move(id: string, dto: MoveTaskDto): Promise<void> {
    await repo.tasks.move(wsId(), id, dto)
    const task = byId.value[id]
    if (!task) return
    const prevListId = task.listId
    const nextListId = dto.listId ?? task.listId
    const patched: Task = {
      ...task,
      listId: nextListId,
      parentId: dto.parentId === undefined ? task.parentId : dto.parentId,
      order: dto.order,
    }
    if (prevListId !== nextListId) {
      byList.value[prevListId] = (byList.value[prevListId] ?? []).filter(t => t.id !== id)
    }
    upsertInList(patched)
  }

  async function remove(id: string): Promise<void> {
    await repo.tasks.remove(wsId(), id)
    removeFromAll(id)
  }

  function reset(): void {
    byList.value = {}
    subtrees.value = {}
    loadingLists.value = new Set()
  }

  return {
    byList, subtrees, byId,
    getForList, getSubtree,
    loadForList, loadSubtree,
    create, update, move, remove, reset,
  }
})

function sortFn(a: Task, b: Task): number {
  if (a.parentId === null && b.parentId === null) return a.order - b.order
  return a.depth - b.depth || a.order - b.order
}
