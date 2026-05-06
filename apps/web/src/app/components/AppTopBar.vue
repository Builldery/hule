<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  UiButton,
  UiCard,
  UiChip,
  UiIcon,
  UiIconButton,
  UiLetterIcon,
  UiPopover,
  UiPopoverPanel,
  UiPopoverTrigger,
} from '@buildery/ui-kit/components'
import { useAuthStore } from '@/auth/store/useAuthStore'
import { usePinsStore } from '@/pin/store/usePinsStore'
import type { Pin } from '@hule/types'

const router = useRouter()
const authStore = useAuthStore()
const pinsStore = usePinsStore()

const user = computed(() => authStore.user)

function getInitials(): string {
  const u = user.value
  if (!u) return '?'
  const source = (u.name ?? '').trim() || u.email
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase() || source[0].toUpperCase()
}

const initials = computed(getInitials)

async function logout(): Promise<void> {
  authStore.logout()
  await router.push({ name: 'login' })
}

function navigateToPin(pin: Pin): void {
  if (pin.entity === 'view') {
    void router.push({ name: 'view', params: { viewId: pin.entityId } })
  }
}

async function removePin(pin: Pin): Promise<void> {
  await pinsStore.remove(pin.id)
}
</script>

<template>
  <div class="topbar">
    <div class="topbar-brand">
      <UiIconButton icon-name="TaskList" fill="filled" color="blue" size="small" />
      <span class="brand">Hule</span>
    </div>

    <div class="topbar-pins">
      <UiChip
        v-for="pin in pinsStore.items"
        :key="pin.id"
        class="topbar-pin-chip"
        :label="pin.label"
        fill="outlined"
        color="gray"
        size="medium"
        closable
        close-button-visibility="hover"
        @click="navigateToPin(pin)"
        @close="removePin(pin)"
      >
        <template #icon>
          <UiIcon icon-name="Bookmark" size="small-x" />
        </template>
      </UiChip>
    </div>

    <div class="topbar-user">
      <UiPopover v-if="user" direction="below" :close-on-content-click="false">
        <UiPopoverTrigger class="user-trigger">
          <UiLetterIcon :letters="initials" color="blue" />
        </UiPopoverTrigger>
        <UiPopoverPanel>
          <UiCard class="user-card ui--single-card">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-email muted">{{ user.email }}</div>
            <template #footer>
              <UiButton
                label="Logout"
                fill="tonal"
                color="gray"
                class="logout-btn"
                @click="logout"
              />
            </template>
          </UiCard>
        </UiPopoverPanel>
      </UiPopover>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: var(--bg);
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.brand {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.3px;
}
.topbar-pins {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding: 4px 2px;
}
.topbar-pin-chip {
  --ui-chip__border-radius: 10px;
  --ui-chip__box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);
  --ui-chip__close-overlay-bg: var(--bg);
}
.topbar-user {
  display: flex;
  align-items: center;
}
.user-trigger {
  display: inline-flex;
  cursor: pointer;
}
.user-card {
  --card-padding: 12px;
  --card-content__gap: 4px;
  min-width: 220px;
}
.user-name { font-weight: 600; }
.user-email { font-size: 13px; }
.logout-btn :deep(.ui-button-wrapper) {
  width: 100%;
  --button--justify-content: center;
}
</style>
