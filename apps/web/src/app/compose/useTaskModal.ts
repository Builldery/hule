import { ref } from 'vue'

interface OpenTaskModal {
  spaceId: string
  listId: string
  taskId: string
}

const state = ref<OpenTaskModal | null>(null)

/** Shared singleton that drives the global task-detail modal rendered in
 *  App.vue. List/Kanban/Timeline views call `open()` instead of navigating,
 *  so there's only one consistent way to view a task in-place. */
export function useTaskModal() {
  return {
    open(payload: OpenTaskModal): void {
      state.value = payload
    },
    close(): void {
      state.value = null
    },
  }
}

export function useTaskModalState() {
  return state
}
