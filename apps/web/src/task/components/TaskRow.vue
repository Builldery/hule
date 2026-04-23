<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  UiButton,
  UiCombobox,
  UiListboxOption,
  UiRawInput,
} from '@buildery/ui-kit/components'
import type { Task } from '@hule/types'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, statusMeta, priorityMeta } from '@/task/constants/tasks'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useListsStore } from '@/list/store/useListsStore'
import { useTaskModal } from '@/app/compose/useTaskModal'

const props = defineProps<{ task: Task }>()

const tasksStore = useTasksStore()
const listsStore = useListsStore()
const taskModal = useTaskModal()

const subtaskCount = computed(() =>
  tasksStore.getForList(props.task.listId).filter(t => t.path.includes(props.task.id)).length,
)

function open(): void {
  const list = listsStore.byId[props.task.listId]
  if (!list) return
  taskModal.open({ spaceId: list.spaceId, listId: list.id, taskId: props.task.id })
}

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

async function onStatusChange(v: string): Promise<void> {
  await tasksStore.update(props.task.id, { status: v })
}

async function onPriorityChange(v: string): Promise<void> {
  await tasksStore.update(props.task.id, { priority: v })
}

async function toggleDone(): Promise<void> {
  const next = props.task.status === 'done' ? 'todo' : 'done'
  await tasksStore.update(props.task.id, { status: next })
}

async function remove(): Promise<void> {
  await tasksStore.remove(props.task.id)
}

const statusLabel = (v: string): string => statusMeta(v).label
const priorityLabel = (v: string): string => priorityMeta(v).label
</script>

<template>
  <div class="task-row" :class="{ done: task.status === 'done' }">
    <button class="check" :class="{ checked: task.status === 'done' }" :aria-label="'Toggle done'"
      @click="toggleDone">
      <i v-if="task.status === 'done'" class="pi pi-check"></i>
    </button>

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
    <span v-else class="title" @click="editing = true">
      {{ task.title }}
      <span v-if="subtaskCount > 0" class="subcount muted">
        <i class="pi pi-sitemap"></i>{{ subtaskCount }}
      </span>
    </span>

    <UiCombobox
      :value="task.status"
      :get-display-value="statusLabel"
      size="small"
      class="status-combo"
      :style="{ '--status-color': statusMeta(task.status).color }"
      @update:value="onStatusChange"
    >
      <UiListboxOption
        v-for="o in STATUS_OPTIONS"
        :key="o.value"
        :value="o.value"
        :label="o.label"
      />
    </UiCombobox>

    <UiCombobox
      :value="task.priority"
      :get-display-value="priorityLabel"
      size="small"
      class="priority-combo"
      @update:value="onPriorityChange"
    >
      <UiListboxOption
        v-for="o in PRIORITY_OPTIONS"
        :key="o.value"
        :value="o.value"
      >
        <span class="prio-row">
          <i class="pi" :class="o.icon" :style="{ color: o.color }"></i>
          <span>{{ o.label }}</span>
        </span>
      </UiListboxOption>
    </UiCombobox>

    <UiButton fill="text" color="gray" size="small" class="del" title="Open task" @click="open">
      <i class="pi pi-arrow-up-right" aria-label="Open task" />
    </UiButton>
    <UiButton fill="text" color="gray" size="small" class="del" title="Delete task" @click="remove">
      <i class="pi pi-trash" aria-label="Delete task" />
    </UiButton>
  </div>
</template>

<style scoped>
.task-row {
  display: grid;
  grid-template-columns: 24px 1fr 140px 110px 32px 32px;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border);
}
.subcount {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 6px;
  font-size: 11px;
}
.subcount i { font-size: 10px; }
.task-row:hover .del {
  opacity: 1;
}
.done .title {
  text-decoration: line-through;
  color: var(--text-muted);
}
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
}
.check.checked {
  background: var(--status-done);
  border-color: var(--status-done);
  color: white;
}
.check i { font-size: 10px; }
.title {
  cursor: text;
  padding: 2px 4px;
  border-radius: 3px;
}
.title:hover { background: var(--hover); }
.title-input { display: flex; }
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
/* Status/priority combobox: color the border by the selected status so it
   reads as a pill at a glance without needing a custom trigger slot. */
.status-combo :deep(.input-wrapper) {
  border-color: var(--status-color, var(--border));
}
.prio-row { display: inline-flex; align-items: center; gap: 6px; }
.del { opacity: 0; transition: opacity 0.1s; }
</style>
