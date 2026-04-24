import { computed, ref, type WritableComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export type Mode = 'list' | 'kanban' | 'timeline'

export const MODES: readonly Mode[] = ['list', 'kanban', 'timeline'] as const

const STORAGE_KEY = 'hule.listViewMode'

export function parseMode(v: unknown): Mode {
  return typeof v === 'string' && (MODES as readonly string[]).includes(v)
    ? (v as Mode)
    : 'list'
}

function isMode(v: unknown): v is Mode {
  return typeof v === 'string' && (MODES as readonly string[]).includes(v)
}

function readStored(): Mode {
  if (typeof window === 'undefined') return 'list'
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return isMode(raw) ? raw : 'list'
  } catch {
    return 'list'
  }
}

const stored = ref<Mode>(readStored())

export function useListViewMode(): { mode: WritableComputedRef<Mode> } {
  const route = useRoute()
  const router = useRouter()

  const mode = computed<Mode>({
    get: () => (isMode(route.query.view) ? (route.query.view as Mode) : stored.value),
    set: (v) => {
      stored.value = v
      try {
        window.localStorage.setItem(STORAGE_KEY, v)
      } catch {
        /* ignore quota / private mode errors */
      }
      const query = { ...route.query, view: v === 'list' ? undefined : v }
      void router.replace({ name: 'list', params: route.params, query })
    },
  })

  return { mode }
}
