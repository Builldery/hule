<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  UiIcon,
  UiIconButton,
  UiInfo,
  UiRawInput,
  UiTreeView,
  UiTreeViewItem,
} from '@buildery/ui-kit/components'
import type { List } from '@hule/types'
import { useTasksStore } from '@/task/store/useTasksStore'
import TaskTreeNode from '@/task/components/TaskTreeNode.vue'

const props = defineProps<{ list: List }>()

const tasksStore = useTasksStore()

const expanded = ref(false)
watch(expanded, (v) => {
  if (v) void tasksStore.loadForList(props.list.id)
})

const allTasks = computed(() => tasksStore.getForList(props.list.id))
const rootTasks = computed(() =>
  allTasks.value
    .filter(t => t.parentId === null)
    .sort((a, b) => a.order - b.order),
)

const addingTask = ref(false)
const newTitle = ref('')
const submitting = ref(false)

function onAddClick(): void {
  addingTask.value = true
  expanded.value = true
}

async function createTask(): Promise<void> {
  if (submitting.value) return
  const title = newTitle.value.trim()
  if (!title) {
    addingTask.value = false
    return
  }
  submitting.value = true
  try {
    await tasksStore.create({ listId: props.list.id, title })
    newTitle.value = ''
    addingTask.value = false
  } finally {
    submitting.value = false
  }
}

function cancelCreate(): void {
  newTitle.value = ''
  addingTask.value = false
}
</script>

<template>
  <UiTreeViewItem
    :node-key="`list-${list.id}`"
    :default-open="false"
    @expand="expanded = true"
    @collapse="expanded = false"
  >
    <template #marker="{ isOpen, toggle }">
      <UiIcon
        :icon-name="isOpen ? 'NavArrowDown' : 'NavArrowRight'"
        class="chev-icon"
        width="14px"
        height="14px"
        @click.stop="toggle"
      />
    </template>

    <template #default="{ toggle }">
      <div class="list-row">
        <UiIcon icon-name="List" class="list-icon" width="14px" height="14px" />
        <span class="list-name" @click="toggle">{{ list.name }}</span>
        <span v-if="rootTasks.length > 0" class="count muted">{{ rootTasks.length }}</span>
        <div class="list-actions">
          <UiIconButton
            size="small"
            fill="outlined-tonal"
            color="gray"
            class="act"
            title="Add task"
            icon-name="Plus"
            @click.stop="onAddClick"
          />
          <router-link
            class="open-link"
            :to="{ name: 'list', params: { spaceId: list.spaceId, listId: list.id } }"
            @click.stop
          >
            <UiIconButton
              size="small"
              fill="outlined-tonal"
              color="gray"
              class="act"
              title="Open list"
              icon-name="ArrowUpRight"
            />
          </router-link>
        </div>
      </div>
    </template>

    <template #children>
      <div v-if="addingTask" class="add-task">
        <UiRawInput
          :value="newTitle"
          placeholder="Add a task, press Enter"
          autofocus
          @update:value="(v: unknown) => newTitle = String(v ?? '')"
          @keydown.enter.stop="createTask"
          @keydown.escape="cancelCreate"
          @blur="createTask"
        />
      </div>
      <UiInfo v-if="rootTasks.length === 0 && !addingTask" class="empty">
        No tasks yet.
      </UiInfo>
      <UiTreeView v-if="rootTasks.length > 0">
        <TaskTreeNode
          v-for="t in rootTasks"
          :key="t.id"
          :task="t"
          :all="allTasks"
        />
      </UiTreeView>
    </template>
  </UiTreeViewItem>
</template>

<style scoped>
.chev-icon {
  color: var(--text-muted);
  cursor: pointer;
}
.list-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  flex: 1;
}
.list-icon { color: var(--text-muted); flex-shrink: 0; }
.list-name {
  flex: 1;
  cursor: pointer;
  font-weight: 500;
  padding: 2px 4px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.list-name:hover { background: var(--hover); }
.count { font-size: 12px; }
.list-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.open-link { display: inline-flex; }
.act { opacity: 0; transition: opacity 0.1s; }
.list-row:hover .act { opacity: 1; }
.add-task {
  padding: 4px 0;
  display: flex;
}
.add-task :deep(input) {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  outline: none;
  font: inherit;
  color: inherit;
  background: var(--bg);
}
.add-task :deep(input:focus) { border-color: var(--accent-primary); }
.empty { margin: 4px 0; }
</style>
