import { ref } from 'vue'
import type { View } from '@hule/types'

interface ViewModalState {
  mode: 'create' | 'edit'
  view?: View
}

const state = ref<ViewModalState | null>(null)

export function useViewModal() {
  return {
    openCreate(): void {
      state.value = { mode: 'create' }
    },
    openEdit(view: View): void {
      state.value = { mode: 'edit', view }
    },
    close(): void {
      state.value = null
    },
  }
}

export function useViewModalState() {
  return state
}
