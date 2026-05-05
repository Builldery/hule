import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Tag } from '@hule/types'
import type { CreateTagDto, UpdateTagDto } from '@/app/api/IRepo'
import { repo } from '@/app/api'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'
import { useTasksStore } from '@/task/store/useTasksStore'

function sortByName(a: Tag, b: Tag): number {
  return a.name.localeCompare(b.name)
}

export const useTagsStore = defineStore('tags', () => {
  const items = ref<Tag[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  const byId = computed<Record<string, Tag>>(() => {
    const out: Record<string, Tag> = {}
    for (const t of items.value) out[t.id] = t
    return out
  })

  const sorted = computed<Tag[]>(() => [...items.value].sort(sortByName))

  function wsId(): string {
    return useWorkspacesStore().requireCurrentId()
  }

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return
    if (loading.value) return
    loading.value = true
    try {
      items.value = await repo.tags.list(wsId())
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateTagDto): Promise<Tag> {
    const created = await repo.tags.create(wsId(), dto)
    items.value = [...items.value, created].sort(sortByName)
    return created
  }

  async function update(id: string, patch: UpdateTagDto): Promise<Tag> {
    const updated = await repo.tags.update(wsId(), id, patch)
    items.value = items.value.map(t => (t.id === id ? updated : t)).sort(sortByName)
    return updated
  }

  async function remove(id: string): Promise<void> {
    await repo.tags.remove(wsId(), id)
    items.value = items.value.filter(t => t.id !== id)
    useTasksStore().stripTagFromAll(id)
  }

  function reset(): void {
    items.value = []
    loaded.value = false
    loading.value = false
  }

  return { items, loaded, loading, byId, sorted, load, create, update, remove, reset }
})
