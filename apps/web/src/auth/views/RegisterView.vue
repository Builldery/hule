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

const username = ref('')
const email = ref('')
const name = ref('')
const password = ref('')
const submitting = ref(false)
const formError = ref<string | null>(null)

const USERNAME_RE = /^[a-zA-Z0-9_]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): string | null {
  const u = username.value.trim()
  if (u.length < 3 || u.length > 32) return 'Username must be 3-32 characters'
  if (!USERNAME_RE.test(u)) return 'Username: letters, digits, underscore only'
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
  formError.value = null
  const err = validate()
  if (err) {
    formError.value = err
    return
  }
  submitting.value = true
  try {
    await authStore.register({
      username: username.value.trim(),
      email: email.value.trim(),
      name: name.value.trim(),
      password: password.value,
    })
    await workspacesStore.load(true)
    toast.success('Account created')
    await router.replace('/')
  } catch (e) {
    if (e instanceof HttpError) {
      formError.value = readMessage(e.body, 'Failed to create account')
    } else {
      formError.value = 'Failed to create account'
    }
    toast.error(formError.value)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout title="Create account" subtitle="Set up your Hule workspace">
    <form class="auth-form" @submit.prevent="onSubmit">
      <UiInput
        label="Username"
        :value="username"
        placeholder="john_doe"
        autofocus
        :disabled="submitting"
        @update:value="(v: unknown) => (username = String(v ?? ''))"
      />
      <UiInput
        label="Email"
        type="email"
        :value="email"
        placeholder="you@example.com"
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
      <p v-if="formError" class="form-error">{{ formError }}</p>
      <UiButton
        type="submit"
        label="Create account"
        color="blue"
        fill="filled"
        :disabled="submitting"
        @click="onSubmit"
      />
    </form>
    <p class="auth-footer">
      Already have an account?
      <router-link to="/login">Sign in</router-link>
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
