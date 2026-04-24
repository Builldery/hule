<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UiButton, UiInput, UiInputPassword } from '@buildery/ui-kit/components'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/auth/store/useAuthStore'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'
import { HttpError } from '@/app/api/httpClient'
import AuthLayout from '@/auth/views/AuthLayout.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const workspacesStore = useWorkspacesStore()

const login = ref('')
const password = ref('')
const submitting = ref(false)
const formError = ref<string | null>(null)

function readMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message
    if (typeof m === 'string') return m
    if (Array.isArray(m) && m.length > 0 && typeof m[0] === 'string') return m.join(', ')
  }
  return fallback
}

async function onSubmit(): Promise<void> {
  if (submitting.value) return
  formError.value = null
  if (!login.value.trim() || !password.value) {
    formError.value = 'Enter login and password'
    return
  }
  submitting.value = true
  try {
    await authStore.login({ login: login.value.trim(), password: password.value })
    await workspacesStore.load(true)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (err) {
    if (err instanceof HttpError) {
      formError.value = readMessage(err.body, 'Invalid login or password')
    } else {
      formError.value = 'Failed to sign in'
    }
    toast.error(formError.value)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Sign in" subtitle="Welcome back to Hule">
    <form class="auth-form" @submit.prevent="onSubmit">
      <UiInput
        label="Username or email"
        :value="login"
        placeholder="your_login"
        autofocus
        :disabled="submitting"
        @update:value="(v: unknown) => (login = String(v ?? ''))"
      />
      <UiInputPassword
        v-model="password"
        label="Password"
        placeholder="••••••••"
        :disabled="submitting"
      />
      <p v-if="formError" class="form-error">{{ formError }}</p>
      <UiButton
        type="submit"
        label="Sign in"
        color="blue"
        fill="filled"
        :disabled="submitting"
        @click="onSubmit"
      />
    </form>
    <p class="auth-footer">
      No account yet?
      <router-link to="/register">Create one</router-link>
    </p>
  </AuthLayout>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-error {
  margin: 0;
  color: #dc2626;
  font-size: 13px;
}
.auth-footer {
  margin: 0;
  font-size: 13px;
  text-align: center;
  color: #4b5563;
}
.auth-footer a {
  color: #2563eb;
  text-decoration: none;
}
.auth-footer a:hover {
  text-decoration: underline;
}
</style>
