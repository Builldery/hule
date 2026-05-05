<script setup lang="ts">
import { ref } from 'vue'
import {
  UiIconButton,
  UiInfo,
  UiInput,
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
      <UiIconButton
        v-if="!adding"
        size="small"
        fill="outlined"
        color="gray"
        title="Add space"
        icon-name="Plus"
        @click="adding = true"
      />
    </div>

    <div v-if="adding" class="sidebar-input">
      <UiInput
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
    <UiInfo v-else-if="spacesStore.items.length === 0 && !adding" class="sidebar-info">
      No spaces yet
    </UiInfo>

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
  padding: 4px 0 8px;
}
.brand {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 0.3px;
}
.sidebar-input {
  padding: 4px 12px 8px;
}
.sidebar-empty {
  padding: 8px 16px;
  font-size: 13px;
}
.sidebar-info {
  margin: 8px 12px;
}
:deep(.ui-tree-view-item__row) {
  gap: 4px;
}
</style>
