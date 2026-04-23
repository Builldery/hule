<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Task } from '@hule/types'
import { priorityMeta } from '@/task/constants/tasks'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useListsStore } from '@/list/store/useListsStore'

const props = defineProps<{ task: Task }>()
const tasksStore = useTasksStore()
const listsStore = useListsStore()
const router = useRouter()

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
  void router.push({
    name: 'task',
    params: { spaceId: list.spaceId, listId: list.id, taskId: props.task.id },
  })
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
      <i v-if="task.priority !== 'none'" class="pi" :class="priorityMeta(task.priority).icon"
         :style="{ color: priorityMeta(task.priority).color }"></i>
      <span v-if="subtaskCount > 0" class="chip">
        <i class="pi pi-sitemap"></i>{{ subtaskCount }}
      </span>
      <span v-if="task.dueDate" class="chip">
        <i class="pi pi-calendar"></i>{{ new Date(task.dueDate).toLocaleDateString() }}
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
.chip i { font-size: 10px; }
</style>
