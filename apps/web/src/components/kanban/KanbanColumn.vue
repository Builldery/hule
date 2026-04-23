<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { Task } from '../../data/types'
import type { StatusOption } from '../../constants/tasks'
import { useTasksStore } from '../../stores/tasks'
import KanbanCard from './KanbanCard.vue'

const props = defineProps<{ status: StatusOption; items: Task[] }>()

const tasksStore = useTasksStore()

async function onAdd(event: { item: HTMLElement }): Promise<void> {
  const id = event.item.dataset.taskId
  if (!id) return
  const task = tasksStore.byId[id]
  if (!task || task.status === props.status.value) return
  try {
    await tasksStore.update(id, { status: props.status.value })
  } catch (e) {
    console.error('Failed to update status', e)
  }
}
</script>

<template>
  <div class="kanban-column">
    <header class="col-head">
      <span class="dot" :style="{ background: status.color }"></span>
      <span class="col-title">{{ status.label }}</span>
      <span class="count muted">{{ items.length }}</span>
    </header>

    <VueDraggable
      :model-value="items"
      group="tasks"
      :animation="150"
      ghost-class="ghost"
      class="col-body"
      @add="onAdd"
    >
      <div v-for="t in items" :key="t.id" :data-task-id="t.id">
        <KanbanCard :task="t" />
      </div>
    </VueDraggable>
  </div>
</template>

<style scoped>
.kanban-column {
  flex: 1 1 280px;
  min-width: 240px;
  max-width: 320px;
  background: var(--bg-muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
}
.col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 4px 8px;
  font-weight: 600;
  font-size: 13px;
}
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.count {
  margin-left: auto;
  font-weight: 400;
  font-size: 12px;
}
.col-body {
  flex: 1;
  min-height: 80px;
}
.ghost {
  opacity: 0.4;
}
</style>
