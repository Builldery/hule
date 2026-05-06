<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useTasksStore } from '@/task/store/useTasksStore'
import { STATUS_OPTIONS } from '@/task/constants/tasks'
import KanbanColumn from '@/kanban/components/KanbanColumn.vue'

const props = defineProps<{ listIds: string[] }>()

const tasksStore = useTasksStore()

const allTasks = computed(() =>
  props.listIds.flatMap(id => tasksStore.getForList(id)).filter(t => t.parentId === null),
)

const columns = computed(() =>
  STATUS_OPTIONS.map(status => ({
    status,
    items: allTasks.value
      .filter(t => t.status === status.value)
      .sort((a, b) => a.order - b.order),
  })),
)

function load(): void {
  props.listIds.forEach(id => void tasksStore.loadForList(id))
}

onMounted(load)
watch(() => props.listIds, load, { deep: true })
</script>

<template>
  <div class="view-kanban">
    <KanbanColumn
      v-for="col in columns"
      :key="col.status.value"
      :status="col.status"
      :items="col.items"
    />
  </div>
</template>

<style scoped>
.view-kanban {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  align-items: flex-start;
  min-width: min-content;
}
</style>
