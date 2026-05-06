<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ViewMode } from '@/timeline/classes/GanttWindowCalculator'
import { UiInfo, UiPopover, UiPopoverTrigger, UiPopoverPanel } from '@buildery/ui-kit/components'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useListsStore } from '@/list/store/useListsStore'
import { useTaskModal } from '@/app/compose/useTaskModal'
import type { Task } from '@hule/types'
import GanttToolbar from '@/timeline/components/GanttToolbar.vue'
import GanttQuickAddPopover from '@/timeline/components/GanttQuickAddPopover.vue'
import { toDataItem } from '@/timeline/classes/GanttItemBuilder'
import { windowForMode, initialCenter } from '@/timeline/classes/GanttWindowCalculator'
import { useVisTimeline } from '@/timeline/compose/useVisTimeline'
import { useTodayMarker } from '@/timeline/compose/useTodayMarker'
import { useGanttGhostBar } from '@/timeline/compose/useGanttGhostBar'
import { useGanttQuickAdd } from '@/timeline/compose/useGanttQuickAdd'
import { useGanttViewMode } from '@/timeline/compose/useGanttViewMode'
import '@/timeline/styles/gantt.css'
import '@/timeline/styles/gantt-bar.css'

const props = defineProps<{ listIds: string[] }>()

const tasksStore = useTasksStore()
const listsStore = useListsStore()
const taskModal = useTaskModal()

const visibleTasks = computed<Task[]>(() =>
  props.listIds.flatMap(id => tasksStore.getForList(id)).filter(t => t.startDate && t.dueDate),
)

const mount = ref<HTMLDivElement | null>(null)
const popoverRef = ref<{ open: () => void } | null>(null)
const viewMode = ref<ViewMode>('Week')
const snapUnit = computed<'hour' | 'day'>(() => viewMode.value === 'Days3' ? 'hour' : 'day')

let suppressNextSync = false
const visTl = useVisTimeline({
  mountRef: mount,
  window: windowForMode(viewMode.value, new Date()),
  snapUnit,
  onItemMove: async (id, start, end) => {
    suppressNextSync = true
    await tasksStore.update(id, {
      startDate: start.toISOString(),
      dueDate: end.toISOString(),
    })
  },
  onItemClick: (id) => {
    const task = visibleTasks.value.find(t => t.id === id)
    if (!task) return
    const spaceId = listsStore.byId[task.listId]?.spaceId ?? ''
    taskModal.open({ spaceId, listId: task.listId, taskId: id })
  },
})

const { viewModes, goToday, fitAll } = useGanttViewMode(visTl.timeline, viewMode)
const { install: installTodayMarker } = useTodayMarker(visTl.timeline, mount)

const quickAdd = useGanttQuickAdd({
  listId: computed(() => props.listIds[0] ?? ''),
})

const ghost = useGanttGhostBar({
  mountRef: mount,
  timeline: visTl.timeline,
  popoverOpen: quickAdd.popoverOpen,
})

function onMountClick(e: MouseEvent): void {
  if (quickAdd.popoverOpen.value) return
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
  await Promise.all(props.listIds.map(id => tasksStore.loadForList(id)))
  rebuildTimeline()
  mount.value?.addEventListener('click', onMountClick)
})

onBeforeUnmount(() => {
  mount.value?.removeEventListener('click', onMountClick)
})

watch(() => props.listIds, async ids => {
  await Promise.all(ids.map(id => tasksStore.loadForList(id)))
  rebuildTimeline()
}, { deep: true })

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
    <UiInfo v-if="visibleTasks.length === 0" class="gantt-empty">
      No scheduled tasks. Set Start date and Due date on a task to see it here.
    </UiInfo>
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
.gantt-empty { margin: 16px; }
.vis-mount {
  flex: 1;
  min-height: 0;
  min-width: 0;
  position: relative;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  background: #fff;
}
</style>
