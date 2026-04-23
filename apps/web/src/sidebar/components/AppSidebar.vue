<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiInput } from '@buildery/ui-kit/components'
import { useToast } from 'primevue/usetoast'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import SpaceNode from '@/space/components/SpaceSidebarNode.vue'

const spacesStore = useSpacesStore()
const toast = useToast()

const adding = ref(false)
const newName = ref('')

async function submit(): Promise<void> {
  const name = newName.value.trim()
  if (!name) {
    adding.value = false
    return
  }
  try {
    await spacesStore.create({ name })
    newName.value = ''
    adding.value = false
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Failed to create space', detail: String(e), life: 4000 })
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
      <UiInput
        :value="newName"
        placeholder="Space name"
        autofocus
        size="small"
        @update:value="(v: unknown) => newName = String(v ?? '')"
        @keydown.enter="submit"
        @keydown.escape="cancel"
        @blur="submit"
      />
    </div>

    <div v-if="spacesStore.loading && !spacesStore.loaded" class="sidebar-empty muted">Loading…</div>
    <div v-else-if="spacesStore.items.length === 0 && !adding" class="sidebar-empty muted">
      No spaces yet
    </div>

    <SpaceNode
      v-for="space in spacesStore.items"
      :key="space.id"
      :space="space"
    />
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
.sidebar-input :deep(.p-inputtext) {
  width: 100%;
}
.sidebar-empty {
  padding: 8px 16px;
  font-size: 13px;
}
</style>
