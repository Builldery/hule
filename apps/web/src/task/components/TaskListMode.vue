<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { UiInfo, UiInput, UiTreeView } from '@buildery/ui-kit/components'
import { useTasksStore } from '@/task/store/useTasksStore'
import TaskTreeNode from './TaskTreeNode.vue'

const props = defineProps<{ listId: string }>()

const tasksStore = useTasksStore()
const newTitle = ref('')
const creating = ref(false)

const allTasks = computed(() => tasksStore.getForList(props.listId))
const rootTasks = computed(() =>
  allTasks.value
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
  if (creating.value) return
  const title = newTitle.value.trim()
  if (!title) return
  creating.value = true
  try {
    await tasksStore.create({ listId: props.listId, title })
    newTitle.value = ''
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="task-list">
    <div class="add-row">
      <UiInput
        :value="newTitle"
        placeholder="Add a task, press Enter"
       
        class="add-input"
        @update:value="(v: unknown) => newTitle = String(v ?? '')"
        @keydown.enter.stop="createTask"
      />
    </div>
    <UiInfo v-if="rootTasks.length === 0" class="empty">
      No tasks yet.
    </UiInfo>
    <UiTreeView v-else>
      <TaskTreeNode
        v-for="t in rootTasks"
        :key="t.id"
        :task="t"
        :all="allTasks"
      />
    </UiTreeView>
  </div>
</template>

<style scoped>
.task-list { border-top: 1px solid var(--border); }
.add-row { padding: 8px; border-bottom: 1px solid var(--border); }
.add-input { width: 100%; }
.add-input :deep(.p-inputtext) { width: 100%; }
.empty { margin: 8px; }
</style>
