<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  UiPopover,
  UiPopoverTrigger,
  UiPopoverPanel,
} from '@buildery/ui-kit/components'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useListsStore } from '@/list/store/useListsStore'
import { useTaskModal } from '@/app/compose/useTaskModal'
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
const taskModal = useTaskModal()

const listSpaceId = computed(() => listsStore.byId[props.listId]?.spaceId ?? '')

const visibleTasks = computed<Task[]>(() =>
  tasksStore.getForList(props.listId).filter(t => t.startDate && t.dueDate),
)

const mount = ref<HTMLDivElement | null>(null)
const popoverRef = ref<{ open: () => void } | null>(null)

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
  onItemClick: (id) => {
    taskModal.open({ spaceId: listSpaceId.value, listId: props.listId, taskId: id })
  },
})

const { viewMode, viewModes, goToday, fitAll } = useGanttViewMode(visTl.timeline)

const { install: installTodayMarker } = useTodayMarker(visTl.timeline, mount)

const quickAdd = useGanttQuickAdd({
  listId: computed(() => props.listId),
})

const ghost = useGanttGhostBar({
  mountRef: mount,
  timeline: visTl.timeline,
  popoverOpen: quickAdd.popoverOpen,
})

// Clicks on the ghost bar pass through to the timeline panel (the ghost is
// `pointer-events: none` so wheel/hover reach vis-timeline). We open the
// popover imperatively from a mount-level click handler; the separate
// `UiPopoverTrigger` anchor is kept invisible, serving only as a positioning
// target for the popover panel.
function onMountClick(e: MouseEvent): void {
  if (!ghost.ghostVisible.value || !ghost.ghostDay.value) return
  const target = e.target as HTMLElement | null
  if (!target) return
  if (target.closest('.vis-item') || target.closest('.vis-time-axis')) return
  if (!target.closest('.vis-panel.vis-center')) return
  quickAdd.prepareOpen(ghost.ghostDay.value)
  e.stopPropagation()
  popoverRef.value?.open()
}

function onPopoverClose(): void {
  quickAdd.close()
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

onBeforeUnmount(() => {
  mount.value?.removeEventListener('click', onMountClick)
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
        class="hule-ghost"
        :style="{
          left: ghost.ghostLeft.value + 'px',
          top: ghost.ghostTop.value + 'px',
          width: ghost.ghostWidth.value + 'px',
        }"
      />
      <UiPopover
        ref="popoverRef"
        :is-open="quickAdd.popoverOpen.value"
        direction="below"
        :close-on-content-click="false"
        @update:is-open="(v: boolean) => (quickAdd.popoverOpen.value = v)"
        @close="onPopoverClose"
      >
        <UiPopoverTrigger
          class="hule-ghost-anchor"
          :style="{
            left: ghost.ghostLeft.value + 'px',
            top: ghost.ghostTop.value + 'px',
            width: ghost.ghostWidth.value + 'px',
          }"
          tabindex="-1"
        />
        <UiPopoverPanel>
          <GanttQuickAddPopover
            :popover-day="quickAdd.popoverDay.value"
            :active-tab="quickAdd.activeTab.value"
            :find-query="quickAdd.findQuery.value"
            :find-suggestions="quickAdd.findSuggestions.value"
            :new-title="quickAdd.newTitle.value"
            :creating="quickAdd.creating.value"
            @update:active-tab="(v: 'find' | 'create') => (quickAdd.activeTab.value = v)"
            @update:find-query="(v: string) => (quickAdd.findQuery.value = v)"
            @update:new-title="(v: string) => (quickAdd.newTitle.value = v)"
            @complete="quickAdd.searchTasks"
            @find-focus="quickAdd.onFindFocus"
            @find-select="quickAdd.onFindSelect"
            @create-task="quickAdd.createTask"
          />
        </UiPopoverPanel>
      </UiPopover>
    </div>

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

