<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UiButton, UiInput, UiInputPassword } from '@buildery/ui-kit/components'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '@/auth/store/useAuthStore'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'
import { HttpError } from '@/app/api/httpClient'
import AuthLayout from '@/auth/views/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()
const workspacesStore = useWorkspacesStore()

const email = ref('')
const name = ref('')
const password = ref('')
const submitting = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): string | null {
  const e = email.value.trim()
  if (!EMAIL_RE.test(e) || e.length > 254) return 'Enter a valid email'
  const n = name.value.trim()
  if (n.length < 1 || n.length > 100) return 'Name must be 1-100 characters'
  if (password.value.length < 8 || password.value.length > 128) return 'Password must be 8-128 characters'
  return null
}

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
  const validationError = validate()
  if (validationError) {
    toast.error(validationError)
    return
  }
  submitting.value = true
  try {
    await authStore.register({
      email: email.value.trim(),
      name: name.value.trim(),
      password: password.value,
    })
    await workspacesStore.load(true)
    toast.success('Account created')
    await router.replace('/')
  } catch (e) {
    toast.error(e instanceof HttpError ? readMessage(e.body, 'Failed to create account') : 'Failed to create account')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Create account">
    <template #description>
      Already have an account?
      <router-link to="/login">Sign in</router-link>
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
      <UiInput
        label="Full name"
        :value="name"
        placeholder="John Doe"
        :disabled="submitting"
        @update:value="(v: unknown) => (name = String(v ?? ''))"
      />
      <UiInputPassword
        v-model="password"
        label="Password"
        placeholder="At least 8 characters"
        :disabled="submitting"
      />
    </form>
    <template #footer>
      <UiButton
        type="submit"
        label="Create account"
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
