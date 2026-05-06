<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { UiInfo, UiTreeView } from '@buildery/ui-kit/components'
import { useTasksStore } from '@/task/store/useTasksStore'
import TaskTreeNode from '@/task/components/TaskTreeNode.vue'

const props = defineProps<{ listIds: string[] }>()

const tasksStore = useTasksStore()

const allTasks = computed(() =>
  props.listIds.flatMap(id => tasksStore.getForList(id)),
)

const rootTasks = computed(() =>
  allTasks.value
    .filter(t => t.parentId === null)
    .sort((a, b) => a.order - b.order),
)

function load(): void {
  props.listIds.forEach(id => void tasksStore.loadForList(id))
}

onMounted(load)
watch(() => props.listIds, load, { deep: true })
</script>

<template>
  <div class="view-list-mode">
    <UiInfo v-if="rootTasks.length === 0" class="empty">No tasks yet.</UiInfo>
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
.view-list-mode {
  padding: 16px 24px 24px;
}
.empty { margin: 8px 0; }
</style>
