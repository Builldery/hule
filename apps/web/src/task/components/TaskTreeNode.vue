<script lang="ts">
export default { name: 'TaskTreeNode' }
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { UiButton, UiInput } from '@buildery/ui-kit/components'
import Select from 'primevue/select'
import type { Task } from '@hule/types'
import { STATUS_OPTIONS, statusMeta } from '@/task/constants/tasks'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useListsStore } from '@/list/store/useListsStore'

const props = defineProps<{ task: Task; all: Task[] }>()

const tasksStore = useTasksStore()
const listsStore = useListsStore()
const router = useRouter()

function open(): void {
  const list = listsStore.byId[props.task.listId]
  if (!list) return
  void router.push({
    name: 'task',
    params: { spaceId: list.spaceId, listId: list.id, taskId: props.task.id },
  })
}

const children = computed(() =>
  props.all
    .filter(t => t.parentId === props.task.id)
    .sort((a, b) => a.order - b.order),
)

const doneCount = computed(() =>
  children.value.filter(c => c.status === 'done').length,
)

const expanded = ref(true)
const addingSubtask = ref(false)
const subtaskTitle = ref('')
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

async function toggleDone(): Promise<void> {
  const next = props.task.status === 'done' ? 'todo' : 'done'
  await tasksStore.update(props.task.id, { status: next })
}

async function onStatusChange(v: string): Promise<void> {
  await tasksStore.update(props.task.id, { status: v })
}

async function addSubtask(): Promise<void> {
  const v = subtaskTitle.value.trim()
  if (!v) { addingSubtask.value = false; return }
  await tasksStore.create({
    listId: props.task.listId,
    parentId: props.task.id,
    title: v,
  })
  subtaskTitle.value = ''
  addingSubtask.value = false
  expanded.value = true
}

async function remove(): Promise<void> {
  await tasksStore.remove(props.task.id)
}
</script>

<template>
  <div class="tree-node">
    <div class="tree-row" :class="{ done: task.status === 'done' }">
      <button
        v-if="children.length > 0"
        class="chev"
        :aria-label="expanded ? 'Collapse' : 'Expand'"
        @click="expanded = !expanded"
      >
        <i class="pi" :class="expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
      </button>
      <span v-else class="chev placeholder"></span>

      <button class="check" :class="{ checked: task.status === 'done' }" @click="toggleDone">
        <i v-if="task.status === 'done'" class="pi pi-check"></i>
      </button>

      <UiInput
        v-if="editing"
        :value="titleDraft"
        size="small"
        class="title-input"
        autofocus
        @update:value="(v: unknown) => titleDraft = String(v ?? '')"
        @keydown.enter="saveTitle"
        @keydown.escape="() => { titleDraft = props.task.title; editing = false }"
        @blur="saveTitle"
      />
      <span v-else class="title" @click="editing = true">{{ task.title }}</span>

      <span v-if="children.length > 0" class="count muted">{{ doneCount }}/{{ children.length }}</span>

      <Select
        :model-value="task.status"
        :options="STATUS_OPTIONS"
        option-label="label"
        option-value="value"
        size="small"
        class="pill"
        @update:model-value="onStatusChange"
      >
        <template #value>
          <span class="pill-inner" :style="{ background: statusMeta(task.status).color }">
            {{ statusMeta(task.status).label }}
          </span>
        </template>
      </Select>

      <UiButton size="small" fill="text" color="gray" class="act" title="Add subtask" @click="addingSubtask = true">
        <i class="pi pi-plus" aria-label="Add subtask" />
      </UiButton>
      <UiButton size="small" fill="text" color="gray" class="act" title="Open task" @click="open">
        <i class="pi pi-arrow-up-right" aria-label="Open task" />
      </UiButton>
      <UiButton size="small" fill="text" color="gray" class="act" title="Delete" @click="remove">
        <i class="pi pi-trash" aria-label="Delete" />
      </UiButton>
    </div>

    <div v-if="expanded" class="children">
      <div v-if="addingSubtask" class="add-child">
        <UiInput
          :value="subtaskTitle"
          placeholder="Subtask title"
          size="small"
          autofocus
          @update:value="(v: unknown) => subtaskTitle = String(v ?? '')"
          @keydown.enter="addSubtask"
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
    </div>
  </div>
</template>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.chev {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  display: grid;
  place-items: center;
}
.chev.placeholder { cursor: default; }
.chev i { font-size: 10px; }
.check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--text-muted);
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
  flex-shrink: 0;
}
.check.checked { background: var(--status-done); border-color: var(--status-done); color: white; }
.check i { font-size: 10px; }
.title { cursor: text; padding: 2px 4px; border-radius: 3px; flex: 1; }
.title:hover { background: var(--hover); }
.done .title { text-decoration: line-through; color: var(--text-muted); }
.title-input { flex: 1; }
.title-input :deep(.p-inputtext) { width: 100%; }
.count { font-size: 12px; }
.pill :deep(.p-select-label) { padding: 2px 6px; font-size: 12px; }
.pill-inner {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}
.act { opacity: 0; transition: opacity 0.1s; }
.tree-row:hover .act { opacity: 1; }
.children { padding-left: 24px; }
.add-child { padding: 4px 0; }
.add-child :deep(.p-inputtext) { width: 100%; }
</style>
