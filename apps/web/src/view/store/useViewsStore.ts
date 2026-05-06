import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { View, CreateViewDto, UpdateViewDto } from '@hule/types'
import { repo } from '@/app/api'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'

export const useViewsStore = defineStore('views', () => {
  const items = ref<View[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  const byId = computed<Record<string, View>>(() => {
    const out: Record<string, View> = {}
    items.value.forEach(v => { out[v.id] = v })
    return out
  })

  function wsId(): string {
    return useWorkspacesStore().requireCurrentId()
  }

  async function loadAll(force = false): Promise<void> {
    if (loaded.value && !force) return
    if (loading.value) return
    loading.value = true
    try {
      items.value = await repo.views.list(wsId())
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateViewDto): Promise<View> {
    const created = await repo.views.create(wsId(), dto)
    items.value = [...items.value, created]
    return created
  }

  async function update(id: string, patch: UpdateViewDto): Promise<View> {
    const updated = await repo.views.update(wsId(), id, patch)
    items.value = items.value.map(v => (v.id === id ? updated : v))
    return updated
  }

  async function remove(id: string): Promise<void> {
    const prev = items.value
    items.value = items.value.filter(v => v.id !== id)
    try {
      await repo.views.remove(wsId(), id)
    } catch (e) {
      items.value = prev
      throw e
    }
  }

  function reset(): void {
    items.value = []
    loading.value = false
    loaded.value = false
  }

  return { items, loading, loaded, byId, loadAll, create, update, remove, reset }
})
