<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { UiModal } from '@buildery/ui-kit/components'
import TaskView from '@/task/views/TaskView.vue'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useListsStore } from '@/list/store/useListsStore'
import type { Task } from '@hule/types'

import GanttToolbar from '../components/GanttToolbar.vue'
import GanttQuickAddPopover from '../components/GanttQuickAddPopover.vue'
import { toDataItem } from '../classes/GanttItemBuilder'
import { windowForMode, initialCenter } from '../classes/GanttWindowCalculator'
import { useVisTimeline } from '../compose/useVisTimeline'
import { useTodayMarker } from '../compose/useTodayMarker'
import { useGanttGhostBar } from '../compose/useGanttGhostBar'
import { useGanttQuickAdd } from '../compose/useGanttQuickAdd'
import { useGanttViewMode } from '../compose/useGanttViewMode'

import '../styles/gantt.css'
import '../styles/gantt-bar.css'

const props = defineProps<{ listId: string }>()

const tasksStore = useTasksStore()
const listsStore = useListsStore()

const openTaskId = ref<string | null>(null)
const listSpaceId = computed(() => listsStore.byId[props.listId]?.spaceId ?? '')
const taskDialogVisible = computed({
  get: () => openTaskId.value !== null,
  set: (v: boolean) => { if (!v) openTaskId.value = null },
})

const visibleTasks = computed<Task[]>(() =>
  tasksStore.getForList(props.listId).filter(t => t.startDate && t.dueDate),
)

const mount = ref<HTMLDivElement | null>(null)
const popoverRef = ref<InstanceType<typeof GanttQuickAddPopover> | null>(null)

let suppressNextSync = false
const visTl = useVisTimeline({
  mountRef: mount,
  window: windowForMode('Week', new Date()),
  onItemMove: async (id, start, end) => {
    suppressNextSync = true
    await tasksStore.update(id, {
      startDate: start.toISOString(),
      dueDate: end.toISOString(),
    })
  },
  onItemClick: (id) => { openTaskId.value = id },
})

const { viewMode, viewModes, goToday, fitAll } = useGanttViewMode(visTl.timeline)

const { install: installTodayMarker } = useTodayMarker(visTl.timeline, mount)

const quickAdd = useGanttQuickAdd({
  listId: computed(() => props.listId),
  popoverRef,
})

const ghost = useGanttGhostBar({
  mountRef: mount,
  timeline: visTl.timeline,
  popoverOpen: quickAdd.popoverOpen,
})

function onMountClick(e: MouseEvent): void {
  const click = ghost.onMountClick(e)
  if (!click) return
  quickAdd.open(e, click.day, click.anchor)
}

function onPopoverHide(): void {
  quickAdd.onHide()
  ghost.hideGhost()
}

function rebuildTimeline(): void {
  const items = visibleTasks.value.map(toDataItem)
  const center = initialCenter(visibleTasks.value, viewMode.value)
  const win = windowForMode(viewMode.value, center)
  visTl.create(items, win)
  installTodayMarker()
}

onMounted(async () => {
  await tasksStore.loadForList(props.listId)
  rebuildTimeline()
  mount.value?.addEventListener('click', onMountClick)
})

watch(() => props.listId, async id => {
  await tasksStore.loadForList(id)
  rebuildTimeline()
})

watch(visibleTasks, () => {
  if (suppressNextSync) { suppressNextSync = false; return }
  visTl.syncData(visibleTasks.value.map(toDataItem))
})
</script>

<template>
  <div class="timeline">
    <GanttToolbar
      v-model="viewMode"
      :view-modes="viewModes"
      :task-count="visibleTasks.length"
      :fit-disabled="visibleTasks.length === 0"
      @today="goToday"
      @fit="fitAll"
    />
    <div v-if="visibleTasks.length === 0" class="empty muted">
      No scheduled tasks in this list. Set Start date and Due date on a task to see it here.
    </div>
    <div ref="mount" class="vis-mount">
      <div
        v-show="ghost.ghostVisible.value"
        ref="ghost.ghostEl"
        class="hule-ghost"
        :style="{
          left: ghost.ghostLeft.value + 'px',
          top: ghost.ghostTop.value + 'px',
          width: ghost.ghostWidth.value + 'px',
        }"
      />
    </div>

    <GanttQuickAddPopover
      ref="popoverRef"
      :popover-day="quickAdd.popoverDay.value"
      :active-tab="quickAdd.activeTab.value"
      :find-query="quickAdd.findQuery.value"
      :find-suggestions="quickAdd.findSuggestions.value"
      :new-title="quickAdd.newTitle.value"
      :creating="quickAdd.creating.value"
      @update:active-tab="v => (quickAdd.activeTab.value = v)"
      @update:find-query="v => (quickAdd.findQuery.value = v)"
      @update:new-title="v => (quickAdd.newTitle.value = v)"
      @hide="onPopoverHide"
      @complete="quickAdd.searchTasks"
      @find-focus="quickAdd.onFindFocus"
      @find-select="quickAdd.onFindSelect"
      @create-task="quickAdd.createTask"
    />

    <UiModal
      :is-open="taskDialogVisible"
      :is-show-close-cross="true"
      class="hule-gantt-task-modal"
      @close="taskDialogVisible = false"
    >
      <TaskView
        v-if="openTaskId"
        :space-id="listSpaceId"
        :list-id="props.listId"
        :task-id="openTaskId"
        modal
      />
    </UiModal>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.empty { padding: 32px 16px; }
.vis-mount {
  flex: 1;
  min-height: 0;
  min-width: 0;
  position: relative;
}
</style>

<style>
/* UiModal teleports to body, so this styling is non-scoped. Matches the
   PrimeVue Dialog sizing we replaced: 900px wide, 85vh max height, inner
   padding for TaskView. */
.hule-gantt-task-modal .modal__container { width: 900px; max-width: 95vw; }
.hule-gantt-task-modal .modal__content {
  padding: 24px 32px;
  max-height: 85vh;
  overflow-y: auto;
}
</style>
