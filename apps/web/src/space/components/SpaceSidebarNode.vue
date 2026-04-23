<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
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
    toast.add({ severity: 'error', summary: 'Rename failed', detail: String(e), life: 4000 })
  }
}

function confirmDelete(e: MouseEvent): void {
  confirm.require({
    target: e.currentTarget as HTMLElement,
    message: `Delete space "${props.space.name}" and all its lists/tasks?`,
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await spacesStore.remove(props.space.id)
        if (route.params.spaceId === props.space.id) {
          await router.push({ name: 'home' })
        }
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Delete failed', detail: String(err), life: 4000 })
      }
    },
  })
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
    toast.add({ severity: 'error', summary: 'Failed to create list', detail: String(e), life: 4000 })
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
      <Button
        :icon="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
        size="small"
        text
        severity="secondary"
        class="chev"
        @click="expanded = !expanded"
      />
      <InputText
        v-if="editingName"
        v-model="nameDraft"
        size="small"
        autofocus
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
        <Button icon="pi pi-plus" size="small" text severity="secondary" aria-label="Add list"
          @click.stop="addingList = true; expanded = true" />
        <Button icon="pi pi-trash" size="small" text severity="secondary" aria-label="Delete space"
          @click.stop="confirmDelete" />
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
        <InputText
          v-model="newListName"
          size="small"
          placeholder="List name"
          autofocus
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
