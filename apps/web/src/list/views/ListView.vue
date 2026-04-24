<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useListsStore } from '@/list/store/useListsStore'
import { useListViewMode } from '@/list/compose/useListViewMode'
import TaskListMode from '@/task/components/TaskListMode.vue'
import KanbanBoard from '@/kanban/components/KanbanBoard.vue'
import GanttView from '@/timeline/views/GanttView.vue'

const props = defineProps<{ spaceId: string; listId: string }>()

const listsStore = useListsStore()

const list = computed(() => listsStore.byId[props.listId])

const { mode } = useListViewMode()

onMounted(() => {
  void listsStore.loadForSpace(props.spaceId)
})
watch(() => props.spaceId, (id) => {
  void listsStore.loadForSpace(id)
})
</script>

<template>
  <div v-if="list" class="list-view" :class="'mode-' + mode">
    <div class="mode-body">
      <TaskListMode v-if="mode === 'list'" :list-id="props.listId" />
      <KanbanBoard v-else-if="mode === 'kanban'" :list-id="props.listId" />
      <GanttView v-else-if="mode === 'timeline'" :list-id="props.listId" />
    </div>
  </div>
  <div v-else-if="listsStore.getFor(props.spaceId).length > 0" class="muted">List not found.</div>
  <div v-else class="muted">Loading…</div>
</template>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.mode-body {
  flex: 1;
  min-height: 0;
  padding: 16px 24px 24px;
  overflow: auto;
}
.mode-timeline .mode-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.mode-kanban .mode-body {
  overflow: auto;
}
</style>
