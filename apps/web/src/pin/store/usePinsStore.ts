import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Pin, CreatePinDto } from '@hule/types'
import { repo } from '@/app/api'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'

export const usePinsStore = defineStore('pins', () => {
  const items = ref<Pin[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  const byEntityId = computed<Record<string, Pin>>(() => {
    const out: Record<string, Pin> = {}
    items.value.forEach(p => { out[p.entityId] = p })
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
      items.value = await repo.pins.list(wsId())
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreatePinDto): Promise<Pin> {
    const created = await repo.pins.create(wsId(), dto)
    items.value = [...items.value, created]
    return created
  }

  async function remove(id: string): Promise<void> {
    const prev = items.value
    items.value = items.value.filter(p => p.id !== id)
    try {
      await repo.pins.remove(wsId(), id)
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

  return { items, loading, loaded, byEntityId, loadAll, create, remove, reset }
})
