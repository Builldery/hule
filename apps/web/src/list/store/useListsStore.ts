import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { List, CreateListDto, UpdateListDto, ReorderItem } from '@hule/types'
import { repo } from '@/app/api'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'

export const useListsStore = defineStore('lists', () => {
  const bySpace = ref<Record<string, List[]>>({})
  const loadingSpaces = ref<Set<string>>(new Set())

  const byId = computed<Record<string, List>>(() => {
    const out: Record<string, List> = {}
    for (const lists of Object.values(bySpace.value)) {
      for (const l of lists) out[l.id] = l
    }
    return out
  })

  function wsId(): string {
    return useWorkspacesStore().requireCurrentId()
  }

  function getFor(spaceId: string): List[] {
    return bySpace.value[spaceId] ?? []
  }

  async function loadForSpace(spaceId: string, force = false): Promise<void> {
    if (bySpace.value[spaceId] && !force) return
    if (loadingSpaces.value.has(spaceId)) return
    loadingSpaces.value.add(spaceId)
    try {
      const list = await repo.lists.listBySpace(wsId(), spaceId)
      bySpace.value = { ...bySpace.value, [spaceId]: list }
    } finally {
      loadingSpaces.value.delete(spaceId)
    }
  }

  async function create(dto: CreateListDto): Promise<List> {
    const created = await repo.lists.create(wsId(), dto)
    const current = bySpace.value[dto.spaceId] ?? []
    bySpace.value = {
      ...bySpace.value,
      [dto.spaceId]: [...current, created].sort((a, b) => a.order - b.order),
    }
    return created
  }

  async function update(id: string, patch: UpdateListDto): Promise<List> {
    const updated = await repo.lists.update(wsId(), id, patch)
    const sid = updated.spaceId
    bySpace.value = {
      ...bySpace.value,
      [sid]: (bySpace.value[sid] ?? []).map(l => (l.id === id ? updated : l)),
    }
    return updated
  }

  async function remove(id: string): Promise<void> {
    const existing = byId.value[id]
    if (!existing) return
    const sid = existing.spaceId
    const prev = bySpace.value[sid] ?? []
    bySpace.value = { ...bySpace.value, [sid]: prev.filter(l => l.id !== id) }
    try {
      await repo.lists.remove(wsId(), id)
    } catch (e) {
      bySpace.value = { ...bySpace.value, [sid]: prev }
      throw e
    }
  }

  async function reorderInSpace(spaceId: string, items: ReorderItem[]): Promise<void> {
    await repo.lists.reorder(wsId(), items)
    const map = new Map(items.map(i => [i.id, i.order]))
    bySpace.value = {
      ...bySpace.value,
      [spaceId]: (bySpace.value[spaceId] ?? [])
        .map(l => ({ ...l, order: map.get(l.id) ?? l.order }))
        .sort((a, b) => a.order - b.order),
    }
  }

  function reset(): void {
    bySpace.value = {}
    loadingSpaces.value = new Set()
  }

  return { bySpace, byId, getFor, loadForSpace, create, update, remove, reorderInSpace, reset }
})
