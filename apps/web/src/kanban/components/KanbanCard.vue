<script setup lang="ts">
import { computed, ref } from 'vue'
import { UiIcon } from '@buildery/ui-kit/components'
import type { Task } from '@hule/types'
import { priorityMeta } from '@/task/constants/tasks'
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

const dragging = ref(false)
let downX = 0
let downY = 0

function onMouseDown(e: MouseEvent): void {
  downX = e.clientX
  downY = e.clientY
  dragging.value = false
}
function onMouseMove(e: MouseEvent): void {
  if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) {
    dragging.value = true
  }
}
function onClick(): void {
  if (dragging.value) return
  const list = listsStore.byId[props.task.listId]
  if (!list) return
  taskModal.open({ spaceId: list.spaceId, listId: list.id, taskId: props.task.id })
}
</script>

<template>
  <div
    class="kanban-card"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @click="onClick"
  >
    <div class="title">{{ task.title }}</div>
    <div class="meta">
      <UiIcon
        v-if="task.priority !== 'none'"
        :icon-name="priorityMeta(task.priority).icon"
        :color="priorityMeta(task.priority).color"
        width="12px"
        height="12px"
      />
      <span v-if="subtaskCount > 0" class="chip">
        <UiIcon icon-name="GitFork" width="12px" height="12px" />{{ subtaskCount }}
      </span>
      <span v-if="task.dueDate" class="chip">
        <UiIcon icon-name="Calendar" width="12px" height="12px" />{{ new Date(task.dueDate).toLocaleDateString() }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.kanban-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  margin: 6px 0;
  cursor: grab;
  user-select: none;
  box-shadow: 0 1px 0 rgba(0,0,0,0.02);
}
.kanban-card:active { cursor: grabbing; }
.title { font-size: 13px; margin-bottom: 6px; }
.meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  align-items: center;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
