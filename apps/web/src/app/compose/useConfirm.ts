import { ref, type Ref } from 'vue'

export interface DeleteConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmState extends DeleteConfirmOptions {
  visible: boolean
  resolve: (result: boolean) => void
}

// Shared singleton — one live confirm at a time across the app. The host
// renderer lives in App.vue and reads this ref via useConfirmState().
const state = ref<ConfirmState | null>(null)

export function useConfirm(): {
  delete: (opts: DeleteConfirmOptions) => Promise<boolean>
} {
  return {
    delete: (opts: DeleteConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // Auto-reject any previous dialog if a new one is opened before the
        // user answered — shouldn't happen in normal UX, but keeps semantics
        // deterministic if it does.
        if (state.value) state.value.resolve(false)
        state.value = { ...opts, visible: true, resolve }
      }),
  }
}

export function useConfirmState(): Ref<ConfirmState | null> {
  return state
}

export function closeConfirm(confirmed: boolean): void {
  const cur = state.value
  if (!cur) return
  cur.resolve(confirmed)
  state.value = null
}
