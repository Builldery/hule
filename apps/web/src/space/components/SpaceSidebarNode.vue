<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UiButton, UiInput } from '@buildery/ui-kit/components'
import { useConfirm } from '@/app/compose/useConfirm'
import { useToast } from '@/app/compose/useToast'
import type { Space } from '@hule/types'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useListsStore } from '@/list/store/useListsStore'

const props = defineProps<{ space: Space }>()

const route = useRoute()
const router = useRouter()
const spacesStore = useSpacesStore()
const listsStore = useListsStore()
const confirm = useConfirm()
const toast = useToast()

const expanded = ref(true)
const addingList = ref(false)
const newListName = ref('')
const editingName = ref(false)
const nameDraft = ref(props.space.name)

watch(() => props.space.name, v => { nameDraft.value = v })

watch(expanded, (v) => {
  if (v) void listsStore.loadForSpace(props.space.id)
}, { immediate: true })

async function saveName(): Promise<void> {
  const trimmed = nameDraft.value.trim()
  if (!trimmed || trimmed === props.space.name) {
    nameDraft.value = props.space.name
    editingName.value = false
    return
  }
  try {
    await spacesStore.update(props.space.id, { name: trimmed })
    editingName.value = false
  } catch (e) {
    toast.error(`Rename failed: ${String(e)}`)
  }
}

async function confirmDelete(): Promise<void> {
  const ok = await confirm.delete({
    title: `Delete space "${props.space.name}"?`,
    description: 'All lists and tasks inside will be permanently removed.',
  })
  if (!ok) return
  try {
    await spacesStore.remove(props.space.id)
    if (route.params.spaceId === props.space.id) {
      await router.push({ name: 'home' })
    }
  } catch (err) {
    toast.error(`Delete failed: ${String(err)}`)
  }
}

async function submitNewList(): Promise<void> {
  const name = newListName.value.trim()
  if (!name) {
    addingList.value = false
    return
  }
  try {
    const list = await listsStore.create({ spaceId: props.space.id, name })
    newListName.value = ''
    addingList.value = false
    await router.push({ name: 'list', params: { spaceId: props.space.id, listId: list.id } })
  } catch (e) {
    toast.error(`Failed to create list: ${String(e)}`)
  }
}

function cancelNewList(): void {
  newListName.value = ''
  addingList.value = false
}
</script>

<template>
  <div class="space-node">
    <div class="space-row">
      <UiButton
        size="small"
        fill="text"
        color="gray"
        class="chev"
        :title="expanded ? 'Collapse' : 'Expand'"
        @click="expanded = !expanded"
      >
        <i :class="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
      </UiButton>
      <UiInput
        v-if="editingName"
        :value="nameDraft"
        size="small"
        autofocus
        @update:value="(v: unknown) => nameDraft = String(v ?? '')"
        @keydown.enter="saveName"
        @keydown.escape="() => { nameDraft = props.space.name; editingName = false }"
        @blur="saveName"
      />
      <router-link
        v-else
        class="space-name"
        :to="{ name: 'space', params: { spaceId: props.space.id } }"
        @dblclick.prevent="editingName = true"
      >
        {{ props.space.name }}
      </router-link>

      <div class="space-actions">
        <UiButton size="small" fill="text" color="gray" title="Add list"
          @click.stop="addingList = true; expanded = true">
          <i class="pi pi-plus" aria-label="Add list" />
        </UiButton>
        <UiButton size="small" fill="text" color="gray" title="Delete space"
          @click.stop="confirmDelete">
          <i class="pi pi-trash" aria-label="Delete space" />
        </UiButton>
      </div>
    </div>

    <div v-if="expanded" class="space-children">
      <router-link
        v-for="list in listsStore.getFor(props.space.id)"
        :key="list.id"
        class="list-row"
        :to="{ name: 'list', params: { spaceId: props.space.id, listId: list.id } }"
        active-class="active"
      >
        <i class="pi pi-list"></i>
        <span class="list-name">{{ list.name }}</span>
      </router-link>

      <div v-if="addingList" class="list-row add-list">
        <i class="pi pi-list muted"></i>
        <UiInput
          :value="newListName"
          size="small"
          placeholder="List name"
          autofocus
          @update:value="(v: unknown) => newListName = String(v ?? '')"
          @keydown.enter="submitNewList"
          @keydown.escape="cancelNewList"
          @blur="submitNewList"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.space-node {
  margin-bottom: 4px;
}
.space-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-left: 8px;
  padding-right: 8px;
  min-height: 32px;
}
.space-row:hover .space-actions {
  opacity: 1;
}
.space-actions {
  margin-left: auto;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.12s;
}
.chev :deep(.p-button-icon) {
  font-size: 11px;
}
.space-name {
  flex: 1;
  padding: 4px 6px;
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.space-name:hover {
  background: var(--hover);
}
.space-children {
  display: flex;
  flex-direction: column;
  padding-left: 20px;
}
.list-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 8px;
  margin: 1px 8px;
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  font-size: 13px;
}
.list-row:hover {
  background: var(--hover);
}
.list-row.active {
  background: var(--active-bg);
  color: var(--active-text);
}
.list-row i {
  font-size: 12px;
}
.list-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.add-list :deep(.p-inputtext) {
  flex: 1;
  padding: 2px 6px;
  font-size: 13px;
}
</style>
