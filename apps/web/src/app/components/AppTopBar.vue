<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  UiButton,
  UiButtonGroup,
  UiCard,
  UiLetterIcon,
  UiPopover,
  UiPopoverPanel,
  UiPopoverTrigger,
  UiRadioButton,
  UiRadioGroup,
} from '@buildery/ui-kit/components'
import { useAuthStore } from '@/auth/store/useAuthStore'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useListsStore } from '@/list/store/useListsStore'
import { parseMode, useListViewMode, type Mode } from '@/list/compose/useListViewMode'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const spacesStore = useSpacesStore()
const listsStore = useListsStore()

const spaceId = computed(() => {
  const v = route.params.spaceId
  return typeof v === 'string' ? v : ''
})
const listId = computed(() => {
  const v = route.params.listId
  return typeof v === 'string' ? v : ''
})

const space = computed(() => (spaceId.value ? spacesStore.byId[spaceId.value] ?? null : null))
const list = computed(() => (listId.value ? listsStore.byId[listId.value] ?? null : null))

const { mode } = useListViewMode()
const showViewToggle = computed(() => route.name === 'list')
const modes: { label: string; value: Mode }[] = [
  { label: 'List', value: 'list' },
  { label: 'Kanban', value: 'kanban' },
  { label: 'Timeline', value: 'timeline' },
]

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
</script>

<template>
  <div class="topbar">
    <div class="topbar-path">
      <template v-if="list && space">
        <span class="muted">{{ space.name }} /</span>
        <strong>{{ list.name }}</strong>
      </template>
      <template v-else-if="space">
        <strong>{{ space.name }}</strong>
      </template>
    </div>

    <div v-if="showViewToggle" class="topbar-view-toggle">
      <UiButtonGroup>
        <UiRadioGroup :value="mode" @update:value="(v: unknown) => mode = parseMode(v)">
          <UiRadioButton
            v-for="m in modes"
            :key="m.value"
            :value="m.value"
            :label="m.label"
           
          />
        </UiRadioGroup>
      </UiButtonGroup>
    </div>

    <div class="topbar-user">
      <UiPopover v-if="user" direction="below" :close-on-content-click="false">
        <UiPopoverTrigger class="user-trigger">
          <UiLetterIcon :letters="initials" color="blue" />
        </UiPopoverTrigger>
        <UiPopoverPanel>
          <UiCard class="user-card ui--single-card">
            <div class="user-name">{{ user.name || user.username }}</div>
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
.topbar-path {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 14px;
  margin-right: auto;
}
.topbar-view-toggle {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.topbar-path strong {
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
