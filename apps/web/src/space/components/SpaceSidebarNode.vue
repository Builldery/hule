<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  UiButton,
  UiRawInput,
  UiTreeViewItem,
} from '@buildery/ui-kit/components'
import { useConfirm } from '@/app/compose/useConfirm'
import { useToast } from '@/app/compose/useToast'
import type { List, Space } from '@hule/types'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useListsStore } from '@/list/store/useListsStore'

const props = defineProps<{ space: Space }>()

const route = useRoute()
const router = useRouter()
const spacesStore = useSpacesStore()
const listsStore = useListsStore()
const confirm = useConfirm()
const toast = useToast()

const addingList = ref(false)
const newListName = ref('')
const submittingList = ref(false)
const editingName = ref(false)
const nameDraft = ref(props.space.name)

watch(() => props.space.name, v => { nameDraft.value = v })

// Only load lists when the space is expanded. Expansion state lives inside
// UiTreeView (stateMap keyed by node-key), so we piggy-back via a ref that
// tracks expand/collapse emits.
const expanded = ref(true)
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
  if (submittingList.value) return
  const name = newListName.value.trim()
  if (!name) {
    addingList.value = false
    return
  }
  submittingList.value = true
  try {
    const list = await listsStore.create({ spaceId: props.space.id, name })
    newListName.value = ''
    addingList.value = false
    await router.push({ name: 'list', params: { spaceId: props.space.id, listId: list.id } })
  } catch (e) {
    toast.error(`Failed to create list: ${String(e)}`)
  } finally {
    submittingList.value = false
  }
}

function cancelNewList(): void {
  newListName.value = ''
  addingList.value = false
}

function onAddListClick(): void {
  addingList.value = true
  expanded.value = true
}

const listDrafts = ref<Record<string, { editing: boolean; draft: string }>>({})

function startListEdit(list: List): void {
  listDrafts.value = {
    ...listDrafts.value,
    [list.id]: { editing: true, draft: list.name },
  }
}

async function saveListName(list: List): Promise<void> {
  const entry = listDrafts.value[list.id]
  if (!entry) return
  const trimmed = entry.draft.trim()
  if (!trimmed || trimmed === list.name) {
    const { [list.id]: _removed, ...rest } = listDrafts.value
    listDrafts.value = rest
    return
  }
  try {
    await listsStore.update(list.id, { name: trimmed })
    const { [list.id]: _removed, ...rest } = listDrafts.value
    listDrafts.value = rest
  } catch (e) {
    toast.error(`Rename failed: ${String(e)}`)
  }
}

function cancelListEdit(list: List): void {
  const { [list.id]: _removed, ...rest } = listDrafts.value
  listDrafts.value = rest
}

async function confirmDeleteList(list: List): Promise<void> {
  const ok = await confirm.delete({
    title: `Delete list "${list.name}"?`,
    description: 'All tasks inside will be permanently removed.',
  })
  if (!ok) return
  try {
    await listsStore.remove(list.id)
    if (route.params.listId === list.id) {
      await router.push({ name: 'space', params: { spaceId: props.space.id } })
    }
  } catch (err) {
    toast.error(`Delete failed: ${String(err)}`)
  }
}
</script>

<template>
  <UiTreeViewItem
    :node-key="`space-${space.id}`"
    :default-open="true"
    @expand="expanded = true"
    @collapse="expanded = false"
  >
    <template #marker="{ isOpen, toggle }">
      <i
        class="pi chev-icon"
        :class="isOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
        @click.stop="toggle"
      />
    </template>

    <template #default>
      <div class="space-row">
        <div v-if="editingName" class="name-input">
          <UiRawInput
            :value="nameDraft"
            autofocus
            @update:value="(v: unknown) => nameDraft = String(v ?? '')"
            @keydown.enter.stop="saveName"
            @keydown.escape="() => { nameDraft = props.space.name; editingName = false }"
            @blur="saveName"
          />
        </div>
        <router-link
          v-else
          class="space-name"
          :to="{ name: 'space', params: { spaceId: props.space.id } }"
          @dblclick.prevent="editingName = true"
        >
          {{ props.space.name }}
        </router-link>

        <div class="space-actions">
          <UiButton size="small" fill="text" color="gray" title="Add list" @click.stop="onAddListClick">
            <i class="pi pi-plus" aria-label="Add list" />
          </UiButton>
          <UiButton size="small" fill="text" color="gray" title="Rename space" @click.stop="editingName = true">
            <i class="pi pi-pencil" aria-label="Rename space" />
          </UiButton>
          <UiButton size="small" fill="text" color="gray" title="Delete space" @click.stop="confirmDelete">
            <i class="pi pi-trash" aria-label="Delete space" />
          </UiButton>
        </div>
      </div>
    </template>

    <template #children>
      <UiTreeViewItem
        v-for="list in listsStore.getFor(props.space.id)"
        :key="list.id"
        :node-key="`list-${list.id}`"
      >
        <template #default>
          <div class="list-row" :class="{ active: route.params.listId === list.id }">
            <i class="pi pi-list list-icon"></i>

            <div v-if="listDrafts[list.id]?.editing" class="name-input">
              <UiRawInput
                :value="listDrafts[list.id]!.draft"
                autofocus
                @update:value="(v: unknown) => listDrafts[list.id]!.draft = String(v ?? '')"
                @keydown.enter.stop="saveListName(list)"
                @keydown.escape="cancelListEdit(list)"
                @blur="saveListName(list)"
              />
            </div>
            <router-link
              v-else
              class="list-name"
              :to="{ name: 'list', params: { spaceId: props.space.id, listId: list.id } }"
              @dblclick.prevent="startListEdit(list)"
            >
              {{ list.name }}
            </router-link>

            <div class="list-actions">
              <UiButton size="small" fill="text" color="gray" title="Rename list" @click.stop="startListEdit(list)">
                <i class="pi pi-pencil" aria-label="Rename list" />
              </UiButton>
              <UiButton size="small" fill="text" color="gray" title="Delete list" @click.stop="confirmDeleteList(list)">
                <i class="pi pi-trash" aria-label="Delete list" />
              </UiButton>
            </div>
          </div>
        </template>
      </UiTreeViewItem>

      <div v-if="addingList" class="list-row add-list">
        <i class="pi pi-list list-icon muted"></i>
        <div class="name-input">
          <UiRawInput
            :value="newListName"
            placeholder="List name"
            autofocus
            @update:value="(v: unknown) => newListName = String(v ?? '')"
            @keydown.enter.stop="submitNewList"
            @keydown.escape="cancelNewList"
            @blur="submitNewList"
          />
        </div>
      </div>
    </template>
  </UiTreeViewItem>
</template>

<style scoped>
.chev-icon {
  font-size: 10px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
}
.space-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-right: 8px;
  min-height: 32px;
  flex: 1;
}
.space-row:hover .space-actions { opacity: 1; }
.space-actions {
  margin-left: auto;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.12s;
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
.space-name:hover { background: var(--hover); }
.list-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  margin: 1px 8px 1px 0;
  border-radius: 4px;
  font-size: 13px;
  flex: 1;
  transition: background 0.12s;
}
.list-row:hover { background: var(--hover); }
.list-row.active { background: var(--active-bg); color: var(--active-text); }
.list-row:hover .list-actions { opacity: 1; }
.list-actions {
  margin-left: auto;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.12s;
}
.list-icon { font-size: 12px; }
.list-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-decoration: none;
  color: inherit;
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
.add-list .name-input :deep(input) {
  background: var(--bg);
  border: 1px solid var(--border);
  padding: 2px 6px;
  font-size: 13px;
}
</style>
