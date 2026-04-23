<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { UiInput } from '@buildery/ui-kit/components'
import { useTasksStore } from '@/task/store/useTasksStore'
import TaskRow from './TaskRow.vue'

const props = defineProps<{ listId: string }>()

const tasksStore = useTasksStore()
const newTitle = ref('')

const rootTasks = computed(() =>
  tasksStore
    .getForList(props.listId)
    .filter(t => t.parentId === null)
    .sort((a, b) => a.order - b.order),
)

onMounted(() => {
  void tasksStore.loadForList(props.listId)
})
watch(() => props.listId, (id) => {
  void tasksStore.loadForList(id)
})

async function createTask(): Promise<void> {
  const title = newTitle.value.trim()
  if (!title) return
  await tasksStore.create({ listId: props.listId, title })
  newTitle.value = ''
}
</script>

<template>
  <div class="task-list">
    <div class="add-row">
      <UiInput
        :value="newTitle"
        placeholder="Add a task, press Enter"
        size="small"
        class="add-input"
        @update:value="(v: unknown) => newTitle = String(v ?? '')"
        @keydown.enter="createTask"
      />
    </div>
    <div v-if="rootTasks.length === 0" class="muted empty">
      No tasks yet.
    </div>
    <TaskRow v-for="t in rootTasks" :key="t.id" :task="t" />
  </div>
</template>

<style scoped>
.task-list { border-top: 1px solid var(--border); }
.add-row { padding: 8px; border-bottom: 1px solid var(--border); }
.add-input { width: 100%; }
.add-input :deep(.p-inputtext) { width: 100%; }
.empty { padding: 16px 8px; }
</style>
