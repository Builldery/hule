<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UiAppearActions, UiIcon, UiIconButton, UiListboxOption, UiRawInput } from '@buildery/ui-kit/components'
import type { View, ViewKind } from '@hule/types'
import { useConfirm } from '@/app/compose/useConfirm'
import { useToast } from '@/app/compose/useToast'
import { useViewsStore } from '@/view/store/useViewsStore'
import { usePinsStore } from '@/pin/store/usePinsStore'

const props = defineProps<{ view: View }>()

const route = useRoute()
const router = useRouter()
const viewsStore = useViewsStore()
const pinsStore = usePinsStore()
const confirm = useConfirm()
const toast = useToast()

const isPinned = computed(() => !!pinsStore.byEntityId[props.view.id])

const editingName = ref(false)
const nameDraft = ref(props.view.label)

watch(() => props.view.label, v => { nameDraft.value = v })

function iconFor(kind: ViewKind): string {
  if (kind === 'kanban') return 'Kanban'
  if (kind === 'timeline') return 'Timeline'
  return 'List'
}

async function saveName(): Promise<void> {
  const trimmed = nameDraft.value.trim()
  if (!trimmed || trimmed === props.view.label) {
    nameDraft.value = props.view.label
    editingName.value = false
    return
  }
  try {
    await viewsStore.update(props.view.id, { label: trimmed })
    editingName.value = false
  } catch (e) {
    toast.error(`Rename failed: ${String(e)}`)
  }
}

async function confirmDelete(): Promise<void> {
  const ok = await confirm.delete({
    title: `Удалить view "${props.view.label}"?`,
    description: 'View будет удалён без возможности восстановления.',
  })
  if (!ok) return
  try {
    await viewsStore.remove(props.view.id)
    if (route.params.viewId === props.view.id) {
      await router.push({ name: 'home' })
    }
  } catch (e) {
    toast.error(`Delete failed: ${String(e)}`)
  }
}

function handleMenuSelect(value: string): void {
  if (value === 'edit') editingName.value = true
  if (value === 'delete') void confirmDelete()
}

async function togglePin(): Promise<void> {
  try {
    const pin = pinsStore.byEntityId[props.view.id]
    if (pin) {
      await pinsStore.remove(pin.id)
    } else {
      await pinsStore.create({ label: props.view.label, entity: 'view', entityId: props.view.id })
    }
  } catch (e) {
    toast.error(`Pin failed: ${String(e)}`)
  }
}
</script>

<template>
  <div
    class="view-item"
    :class="{ active: route.params.viewId === view.id }"
  >
    <UiIcon :icon-name="iconFor(view.kind)" class="view-icon" width="14px" height="14px" />

    <div v-if="editingName" class="name-input">
      <UiRawInput
        :value="nameDraft"
        autofocus
        @update:value="(v: unknown) => nameDraft = String(v ?? '')"
        @keydown.enter.stop="saveName"
        @keydown.escape="() => { nameDraft = props.view.label; editingName = false }"
        @blur="saveName"
      />
    </div>
    <router-link
      v-else
      class="view-name"
      :to="{ name: 'view', params: { viewId: view.id } }"
      @dblclick.prevent="editingName = true"
    >
      {{ view.label }}
    </router-link>

    <div class="view-actions">
      <UiIconButton
        size="small"
        fill="outlined-tonal"
        :color="isPinned ? 'blue' : 'gray'"
        :title="isPinned ? 'Открепить' : 'Закрепить'"
        :icon-name="isPinned ? 'PinSlash' : 'Pin'"
        @click.prevent.stop="togglePin"
      />
      <UiAppearActions @select="handleMenuSelect" @click.stop>
        <template #trigger>
          <UiIconButton size="small" fill="outlined-tonal" color="gray" title="More actions" icon-name="MoreHoriz" />
        </template>
        <UiListboxOption value="edit" label="Rename" />
        <UiListboxOption value="delete" label="Delete" />
      </UiAppearActions>
    </div>
  </div>
</template>

<style scoped>
.view-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  margin: 1px 0;
  border-radius: 4px;
  font-size: 13px;
  color: inherit;
  transition: background 0.12s;
}
.view-item:hover {
  background: var(--hover);
}
.view-item.active {
  background: var(--active-bg);
  color: var(--active-text);
}
.view-item:hover .view-actions {
  opacity: 1;
  pointer-events: auto;
}
.view-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 18px;
  padding-right: 10px;
  background: linear-gradient(to right, transparent 0, var(--bg) 18px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;
}
.view-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
  color: inherit;
}
.view-icon {
  flex-shrink: 0;
}
.name-input {
  flex: 1;
  display: flex;
}
.name-input :deep(input) {
  width: 100%;
  padding: 4px 6px;
  border: none;
  outline: none;
  background: var(--hover);
  border-radius: 4px;
  font: inherit;
  color: inherit;
}
</style>
