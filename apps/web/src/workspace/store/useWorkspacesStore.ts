import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { workspacesApi, type CreateWorkspaceDto, type UpdateWorkspaceDto, type Workspace } from '@/workspace/api/workspacesApi'
import { CURRENT_WORKSPACE_STORAGE_KEY } from '@/app/api/httpClient'
import { useAuthStore } from '@/auth/store/useAuthStore'

function readInitialCurrent(): string | null {
  try { return localStorage.getItem(CURRENT_WORKSPACE_STORAGE_KEY) } catch { return null }
}

export const useWorkspacesStore = defineStore('workspaces', () => {
  const items = ref<Workspace[]>([])
  const currentWorkspaceId = ref<string | null>(readInitialCurrent())
  const loaded = ref(false)
  const loading = ref(false)

  const currentWorkspace = computed<Workspace | null>(() => {
    const id = currentWorkspaceId.value
    if (!id) return null
    return items.value.find(w => w.id === id) ?? null
  })

  watch(currentWorkspaceId, (next) => {
    try {
      if (next) localStorage.setItem(CURRENT_WORKSPACE_STORAGE_KEY, next)
      else localStorage.removeItem(CURRENT_WORKSPACE_STORAGE_KEY)
    } catch { /* ignore */ }
  })

  function setCurrent(id: string | null): void {
    currentWorkspaceId.value = id
  }

  function ensureCurrentValid(): void {
    const id = currentWorkspaceId.value
    const hasCurrent = !!id && items.value.some(w => w.id === id)
    if (!hasCurrent) {
      currentWorkspaceId.value = items.value[0]?.id ?? null
    }
  }

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return
    if (loading.value) return
    loading.value = true
    try {
      items.value = await workspacesApi.list()
      loaded.value = true
      ensureCurrentValid()
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateWorkspaceDto): Promise<Workspace> {
    const res = await workspacesApi.create(dto)
    useAuthStore().setToken(res.access_token)
    items.value = [...items.value, res.workspace]
    currentWorkspaceId.value = res.workspace.id
    return res.workspace
  }

  async function update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    const updated = await workspacesApi.update(id, dto)
    items.value = items.value.map(w => (w.id === id ? updated : w))
    return updated
  }

  async function remove(id: string): Promise<void> {
    await workspacesApi.remove(id)
    items.value = items.value.filter(w => w.id !== id)
    ensureCurrentValid()
  }

  function clear(): void {
    items.value = []
    currentWorkspaceId.value = null
    loaded.value = false
  }

  function requireCurrentId(): string {
    const id = currentWorkspaceId.value
    if (!id) throw new Error('No workspace selected')
    return id
  }

  return {
    items,
    currentWorkspaceId,
    currentWorkspace,
    loaded,
    loading,
    setCurrent,
    load,
    create,
    update,
    remove,
    clear,
    requireCurrentId,
  }
})
