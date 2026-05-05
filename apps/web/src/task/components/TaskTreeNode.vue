<script lang="ts">
export default { name: 'TaskTreeNode' }
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  UiIcon,
  UiIconButton,
  UiRawInput,
  UiTreeViewItem,
} from '@buildery/ui-kit/components'
import type { Task } from '@hule/types'
import StatusMenu from '@/task/components/StatusMenu.vue'
import type { StatusOption } from '@/task/constants/tasks'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useListsStore } from '@/list/store/useListsStore'
import { useTaskModal } from '@/app/compose/useTaskModal'

const props = defineProps<{ task: Task; all: Task[] }>()

const tasksStore = useTasksStore()
const listsStore = useListsStore()
const taskModal = useTaskModal()

function open(): void {
  const list = listsStore.byId[props.task.listId]
  if (!list) return
  taskModal.open({ spaceId: list.spaceId, listId: list.id, taskId: props.task.id })
}

const children = computed(() =>
  props.all
    .filter(t => t.parentId === props.task.id)
    .sort((a, b) => a.order - b.order),
)

const doneCount = computed(() =>
  children.value.filter(c => c.status === 'done').length,
)

const addingSubtask = ref(false)
const subtaskTitle = ref('')
const submittingSubtask = ref(false)
const editing = ref(false)
const titleDraft = ref(props.task.title)
watch(() => props.task.title, v => { titleDraft.value = v })

async function saveTitle(): Promise<void> {
  const v = titleDraft.value.trim()
  if (!v || v === props.task.title) {
    titleDraft.value = props.task.title
    editing.value = false
    return
  }
  await tasksStore.update(props.task.id, { title: v })
  editing.value = false
}

async function setStatus(v: string): Promise<void> {
  if (v === props.task.status) return
  await tasksStore.update(props.task.id, { status: v })
}

async function addSubtask(): Promise<void> {
  if (submittingSubtask.value) return
  const v = subtaskTitle.value.trim()
  if (!v) { addingSubtask.value = false; return }
  submittingSubtask.value = true
  try {
    await tasksStore.create({
      listId: props.task.listId,
      parentId: props.task.id,
      title: v,
    })
    subtaskTitle.value = ''
    addingSubtask.value = false
  } finally {
    submittingSubtask.value = false
  }
}

async function remove(): Promise<void> {
  await tasksStore.remove(props.task.id)
}
</script>

<template>
  <UiTreeViewItem :node-key="`task-${task.id}`" :default-open="true">
    <template #marker>
      <StatusMenu :value="task.status" @update:value="setStatus">
        <template #default="{ meta }: { meta: StatusOption }">
          <button
            class="check"
            :class="{ checked: task.status === 'done' }"
            :style="{ '--status-color': meta.color }"
            :title="meta.label"
            type="button"
          >
            <UiIcon v-if="task.status === 'done'" icon-name="Check" width="12px" height="12px" />
          </button>
        </template>
      </StatusMenu>
    </template>

    <template #default>
      <div class="tree-row" :class="{ done: task.status === 'done' }">
        <div v-if="editing" class="title-input">
          <UiRawInput
            :value="titleDraft"
            autofocus
            @update:value="(v: unknown) => titleDraft = String(v ?? '')"
            @keydown.enter.stop="saveTitle"
            @keydown.escape="() => { titleDraft = props.task.title; editing = false }"
            @blur="saveTitle"
          />
        </div>
        <div
          v-else
          class="title-zone"
          role="button"
          tabindex="0"
          @click="open"
          @keydown.enter.prevent="open"
        >
          <span class="title">{{ task.title }}</span>
          <span v-if="children.length > 0" class="count muted">
            <UiIcon icon-name="GitFork" width="12px" height="12px" />
            {{ doneCount }}/{{ children.length }}
          </span>
        </div>

        <div class="actions">
          <UiIconButton size="small" fill="outlined-tonal" color="gray" class="act" title="Add subtask" icon-name="Plus" @click.stop="addingSubtask = true" />
          <UiIconButton v-if="!editing" size="small" fill="outlined-tonal" color="gray" class="act" title="Rename" icon-name="EditPencil" @click.stop="editing = true" />
          <UiIconButton size="small" fill="outlined-tonal" color="red" class="act" title="Delete" icon-name="Trash" @click.stop="remove" />
        </div>
      </div>
    </template>

    <template #children>
      <div v-if="addingSubtask" class="add-child">
        <UiRawInput
          :value="subtaskTitle"
          placeholder="Subtask title"
          autofocus
          @update:value="(v: unknown) => subtaskTitle = String(v ?? '')"
          @keydown.enter.stop="addSubtask"
          @keydown.escape="() => { subtaskTitle = ''; addingSubtask = false }"
          @blur="addSubtask"
        />
      </div>
      <TaskTreeNode
        v-for="c in children"
        :key="c.id"
        :task="c"
        :all="all"
      />
    </template>
  </UiTreeViewItem>
</template>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  flex: 1;
}
:deep(.ui-tree-view-item__marker) { cursor: default; }
.check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--status-color, var(--text-muted));
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
  flex-shrink: 0;
}
.check.checked { background: var(--status-done); border-color: var(--status-done); color: white; }
.title-zone {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  min-width: 0;
}
.title-zone:hover { background: var(--hover); }
.title-zone:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 1px; }
.title { user-select: none; }
.done .title { text-decoration: line-through; color: var(--text-muted); }
.title-input { flex: 1; display: flex; }
.title-input :deep(input) {
  width: 100%;
  padding: 2px 4px;
  border: none;
  outline: none;
  background: var(--hover);
  border-radius: 3px;
  font: inherit;
  color: inherit;
}
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}
.count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  flex-shrink: 0;
}
.act { opacity: 0; transition: opacity 0.1s; }
.tree-row:hover .act { opacity: 1; }
.add-child {
  padding: 4px 0;
  display: flex;
}
.add-child :deep(input) {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  outline: none;
  font: inherit;
  color: inherit;
  background: var(--bg);
}
.add-child :deep(input:focus) { border-color: var(--accent-primary); }
</style>
