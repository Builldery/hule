<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import type { Task } from '@hule/types'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, statusMeta, priorityMeta } from '../../constants/tasks'
import { useTasksStore } from '../../stores/tasks'
import { useListsStore } from '../../stores/lists'

const props = defineProps<{ task: Task }>()

const tasksStore = useTasksStore()
const listsStore = useListsStore()
const router = useRouter()

const subtaskCount = computed(() =>
  tasksStore.getForList(props.task.listId).filter(t => t.path.includes(props.task.id)).length,
)

function open(): void {
  const list = listsStore.byId[props.task.listId]
  if (!list) return
  void router.push({
    name: 'task',
    params: { spaceId: list.spaceId, listId: list.id, taskId: props.task.id },
  })
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
</script>

<template>
  <div class="task-row" :class="{ done: task.status === 'done' }">
    <button class="check" :class="{ checked: task.status === 'done' }" :aria-label="'Toggle done'"
      @click="toggleDone">
      <i v-if="task.status === 'done'" class="pi pi-check"></i>
    </button>

    <InputText
      v-if="editing"
      v-model="titleDraft"
      size="small"
      class="title-input"
      autofocus
      @keydown.enter="saveTitle"
      @keydown.escape="() => { titleDraft = props.task.title; editing = false }"
      @blur="saveTitle"
    />
    <span v-else class="title" @click="editing = true">
      {{ task.title }}
      <span v-if="subtaskCount > 0" class="subcount muted">
        <i class="pi pi-sitemap"></i>{{ subtaskCount }}
      </span>
    </span>

    <Select
      :model-value="task.status"
      :options="STATUS_OPTIONS"
      option-label="label"
      option-value="value"
      size="small"
      class="pill"
      @update:model-value="onStatusChange"
    >
      <template #value="s">
        <span class="pill-inner" :style="{ background: statusMeta(task.status).color }">
          {{ s.placeholder ? s.placeholder : statusMeta(task.status).label }}
        </span>
      </template>
    </Select>

    <Select
      :model-value="task.priority"
      :options="PRIORITY_OPTIONS"
      option-label="label"
      option-value="value"
      size="small"
      class="priority"
      @update:model-value="onPriorityChange"
    >
      <template #value>
        <i class="pi" :class="priorityMeta(task.priority).icon"
           :style="{ color: priorityMeta(task.priority).color, opacity: task.priority === 'none' ? 0.3 : 1 }"></i>
      </template>
      <template #option="o">
        <i class="pi" :class="o.option.icon" :style="{ color: o.option.color }"></i>
        <span style="margin-left: 6px">{{ o.option.label }}</span>
      </template>
    </Select>

    <Button icon="pi pi-arrow-up-right" text severity="secondary" size="small"
      class="del" aria-label="Open task" @click="open" />
    <Button icon="pi pi-trash" text severity="secondary" size="small"
      class="del" aria-label="Delete task" @click="remove" />
  </div>
</template>

<style scoped>
.task-row {
  display: grid;
  grid-template-columns: 24px 1fr 140px 50px 32px 32px;
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
  border: 1.5px solid var(--p-surface-400, #94a3b8);
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
.title-input :deep(.p-inputtext) { width: 100%; }
.pill :deep(.p-select-label) { padding: 2px 6px; font-size: 12px; }
.pill-inner {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}
.priority :deep(.p-select-label) { padding: 2px 6px; }
.del { opacity: 0; transition: opacity 0.1s; }
</style>
