import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { authApi, type AuthResponse, type LoginPayload, type RegisterPayload, type User } from '@/auth/api/authApi'
import { TOKEN_STORAGE_KEY, CURRENT_WORKSPACE_STORAGE_KEY } from '@/app/api/httpClient'

function readInitialToken(): string | null {
  try { return localStorage.getItem(TOKEN_STORAGE_KEY) } catch { return null }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readInitialToken())
  const user = ref<User | null>(null)
  const loadingMe = ref(false)

  const isAuthenticated = computed(() => token.value !== null)

  watch(token, (next) => {
    try {
      if (next) localStorage.setItem(TOKEN_STORAGE_KEY, next)
      else localStorage.removeItem(TOKEN_STORAGE_KEY)
    } catch { /* ignore */ }
  })

  function applyAuthResponse(res: AuthResponse): void {
    token.value = res.access_token
    user.value = res.user
  }

  async function login(dto: LoginPayload): Promise<void> {
    const res = await authApi.login(dto)
    applyAuthResponse(res)
  }

  async function register(dto: RegisterPayload): Promise<void> {
    const res = await authApi.register(dto)
    applyAuthResponse(res)
  }

  async function loadMe(): Promise<void> {
    if (!token.value) return
    if (loadingMe.value) return
    loadingMe.value = true
    try {
      user.value = await authApi.me()
    } finally {
      loadingMe.value = false
    }
  }

  function logout(): void {
    token.value = null
    user.value = null
    try { localStorage.removeItem(CURRENT_WORKSPACE_STORAGE_KEY) } catch { /* ignore */ }
  }

  function setToken(next: string): void {
    token.value = next
  }

  return { token, user, loadingMe, isAuthenticated, login, register, loadMe, logout, setToken }
})
