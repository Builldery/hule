<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useTasksStore } from '@/task/store/useTasksStore'
import { STATUS_OPTIONS } from '@/task/constants/tasks'
import KanbanColumn from './KanbanColumn.vue'

const props = defineProps<{ listId: string }>()
const tasksStore = useTasksStore()

onMounted(() => {
  void tasksStore.loadForList(props.listId)
})
watch(() => props.listId, id => { void tasksStore.loadForList(id) })

const columns = computed(() => {
  const allTasks = tasksStore.getForList(props.listId).filter(t => t.parentId === null)
  return STATUS_OPTIONS.map(status => ({
    status,
    items: allTasks
      .filter(t => t.status === status.value)
      .sort((a, b) => a.order - b.order),
  }))
})
</script>

<template>
  <div class="kanban">
    <KanbanColumn
      v-for="col in columns"
      :key="col.status.value"
      :status="col.status"
      :items="col.items"
    />
  </div>
</template>

<style scoped>
.kanban {
  display: flex;
  gap: 12px;
  padding-bottom: 8px;
  align-items: flex-start;
  min-width: min-content;
}
</style>
