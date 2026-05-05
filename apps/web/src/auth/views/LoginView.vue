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

const email = ref('')
const password = ref('')
const submitting = ref(false)

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
  if (!email.value.trim() || !password.value) {
    toast.error('Enter email and password')
    return
  }
  submitting.value = true
  try {
    await authStore.login({ email: email.value.trim(), password: password.value })
    await workspacesStore.load(true)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (err) {
    toast.error(err instanceof HttpError ? readMessage(err.body, 'Invalid email or password') : 'Failed to sign in')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Sign in">
    <template #description>
      No account yet?
      <router-link to="/register">Create one</router-link>
    </template>
    <form class="auth-form" @submit.prevent="onSubmit">
      <UiInput
        label="Email"
        type="email"
        :value="email"
        placeholder="you@example.com"
        autofocus
        :disabled="submitting"
        @update:value="(v: unknown) => (email = String(v ?? ''))"
      />
      <UiInputPassword
        v-model="password"
        label="Password"
        placeholder="••••••••"
        :disabled="submitting"
      />
    </form>
    <template #footer>
      <UiButton
        type="submit"
        label="Sign in"
        color="blue"
        fill="filled"
        :disabled="submitting"
        @click="onSubmit"
      />
    </template>
  </AuthLayout>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
