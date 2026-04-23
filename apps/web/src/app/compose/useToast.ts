import { toast } from 'vue3-toastify'

/** Thin wrapper over vue3-toastify's `toast.*` methods so call sites keep
 *  the familiar `useToast()` shape (matches what we had with PrimeVue).
 *  The Vue3Toastify plugin + TOAST_CONFIG container is registered in main.ts. */
export function useToast(): {
  success(message: string): void
  error(message: string): void
  warning(message: string): void
  info(message: string): void
} {
  return {
    success: (m) => { toast.success(m) },
    error:   (m) => { toast.error(m) },
    warning: (m) => { toast.warning(m) },
    info:    (m) => { toast.info(m) },
  }
}
