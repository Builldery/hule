<script setup lang="ts">
import { ref } from 'vue'
import {
  UiButton,
  UiRawInput,
  UiTreeView,
} from '@buildery/ui-kit/components'
import { useToast } from '@/app/compose/useToast'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import SpaceNode from '@/space/components/SpaceSidebarNode.vue'

const spacesStore = useSpacesStore()
const toast = useToast()

const adding = ref(false)
const newName = ref('')
const submitting = ref(false)

async function submit(): Promise<void> {
  if (submitting.value) return
  const name = newName.value.trim()
  if (!name) {
    adding.value = false
    return
  }
  submitting.value = true
  try {
    await spacesStore.create({ name })
    newName.value = ''
    adding.value = false
  } catch (e) {
    toast.error(`Failed to create space: ${String(e)}`)
  } finally {
    submitting.value = false
  }
}

function cancel(): void {
  newName.value = ''
  adding.value = false
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-head">
      <div class="brand">Hule</div>
      <UiButton
        v-if="!adding"
        size="small"
        fill="text"
        color="gray"
        title="Add space"
        @click="adding = true"
      >
        <i class="pi pi-plus" aria-label="Add space" />
      </UiButton>
    </div>

    <div v-if="adding" class="sidebar-input">
      <UiRawInput
        :value="newName"
        placeholder="Space name"
        autofocus
        @update:value="(v: unknown) => newName = String(v ?? '')"
        @keydown.enter.stop="submit"
        @keydown.escape="cancel"
        @blur="submit"
      />
    </div>

    <div v-if="spacesStore.loading && !spacesStore.loaded" class="sidebar-empty muted">Loading…</div>
    <div v-else-if="spacesStore.items.length === 0 && !adding" class="sidebar-empty muted">
      No spaces yet
    </div>

    <UiTreeView v-else>
      <SpaceNode
        v-for="space in spacesStore.items"
        :key="space.id"
        :space="space"
      />
    </UiTreeView>
  </div>
</template>

<style scoped>
.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px 8px;
}
.brand {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.3px;
}
.sidebar-input {
  padding: 4px 12px 8px;
}
.sidebar-input :deep(input) {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  outline: none;
  font: inherit;
  color: inherit;
  background: var(--bg);
}
.sidebar-input :deep(input:focus) { border-color: var(--accent-primary); }
.sidebar-empty {
  padding: 8px 16px;
  font-size: 13px;
}
</style>
