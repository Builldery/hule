<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { Timeline, DataSet, type TimelineOptions, type DataItem } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.css'

import SelectButton from 'primevue/selectbutton'
import Popover from 'primevue/popover'
import AutoComplete, { type AutoCompleteCompleteEvent, type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import TaskView from '../../views/TaskView.vue'
import { useTasksStore } from '../../stores/tasks'
import { useListsStore } from '../../stores/lists'
import type { Task } from '@hule/types'
import { priorityMeta, statusMeta } from '../../constants/tasks'

type ViewMode = 'Week' | 'Month' | 'Quarter' | 'Year'

// Mode semantics: how many days fit in the viewport without scrolling.
const DAYS_IN_VIEW: Record<ViewMode, number> = {
  Week: 7,
  Month: 30,
  Quarter: 90,
  Year: 365,
}

const props = defineProps<{ listId: string }>()

const tasksStore = useTasksStore()
const listsStore = useListsStore()

const openTaskId = ref<string | null>(null)
const listSpaceId = computed(() => listsStore.byId[props.listId]?.spaceId ?? '')
const taskDialogVisible = computed({
  get: () => openTaskId.value !== null,
  set: (v: boolean) => { if (!v) openTaskId.value = null },
})

const viewMode = ref<ViewMode>('Week')
const viewModes: ViewMode[] = ['Week', 'Month', 'Quarter', 'Year']

const DAY_MS = 24 * 60 * 60 * 1000

const mount = ref<HTMLDivElement | null>(null)
let timeline: Timeline | null = null
let dataset: DataSet<DataItem> | null = null
let suppressNextSync = false
let skipNextClick = false

// ── Quick-add ghost bar (ClickUp-style: hover over an empty day in the timeline,
// a placeholder bar tracks the cursor; click opens a Find/Create popover). ──
const ghostVisible = ref(false)
const ghostLeft = ref(0)
const ghostTop = ref(0)
const ghostWidth = ref(0)
const ghostDay = ref<Date | null>(null)
const ghostEl = ref<HTMLDivElement | null>(null)

const popoverRef = ref<InstanceType<typeof Popover> | null>(null)
const popoverDay = ref<Date | null>(null)
const popoverOpen = ref(false)
const activeTab = ref<'find' | 'create'>('create')
const findQuery = ref<string>('')
const findSuggestions = ref<Task[]>([])
const newTitle = ref('')
const creating = ref(false)

const visibleTasks = computed<Task[]>(() =>
  tasksStore
    .getForList(props.listId)
    .filter(t => t.startDate && t.dueDate),
)

function toItem(t: Task): DataItem {
  const s = statusMeta(t.status)
  const p = priorityMeta(t.priority)
  const done = t.status === 'done'
  const hasPriority = t.priority !== 'none'
  const fmt = (iso: string): string => new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  // Tooltip (Shneiderman: details on demand) — shown by vis on hover.
  const title = [
    `<b>${escapeHtml(t.title)}</b>`,
    `${fmt(t.startDate!)} → ${fmt(t.dueDate!)}`,
    `Status: ${s.label}${hasPriority ? ` · Priority: ${p.label}` : ''}`,
  ].join('<br>')
  // Shrink the end by 1ms: vis-timeline treats edge-touching items
  // (a.end === b.start) as overlapping and bumps them to different rows.
  // A 1ms offset is imperceptible but lets adjacent 1-day bars (e.g. Mon + Tue)
  // pack into the same row. `onMove` adds the 1ms back before persisting.
  return {
    id: t.id,
    content: escapeHtml(t.title),
    start: new Date(t.startDate!),
    end: new Date(new Date(t.dueDate!).getTime() - 1),
    type: 'range',
    editable: { updateTime: true, updateGroup: false, remove: false },
    title,
    className: [
      'hule-bar',
      `hule-status-${t.status}`,
      hasPriority ? 'has-priority' : '',
      done ? 'is-done' : '',
    ].filter(Boolean).join(' '),
    style: [
      `--bar-color:${s.color}`,
      hasPriority ? `--priority-color:${p.color}` : '',
    ].filter(Boolean).join(';'),
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!))
}

/** Window = exactly N days centered on `center`. */
function windowForMode(mode: ViewMode, center: Date = new Date()): { start: Date; end: Date } {
  const halfMs = (DAYS_IN_VIEW[mode] * DAY_MS) / 2
  return {
    start: new Date(center.getTime() - halfMs),
    end: new Date(center.getTime() + halfMs),
  }
}

/** Pick a sensible initial center: today if any task overlaps the default week, else nearest-to-today task's start. */
function initialCenter(tasks: Task[], mode: ViewMode): Date {
  const now = Date.now()
  const halfMs = (DAYS_IN_VIEW[mode] * DAY_MS) / 2
  const winStart = now - halfMs
  const winEnd = now + halfMs
  const overlaps = tasks.some(t => {
    const s = new Date(t.startDate!).getTime()
    const e = new Date(t.dueDate!).getTime()
    return e >= winStart && s <= winEnd
  })
  if (overlaps || tasks.length === 0) return new Date()
  // No task near today — center on the closest task by start date.
  let nearest = tasks[0]
  let bestDist = Math.abs(new Date(nearest.startDate!).getTime() - now)
  for (const t of tasks) {
    const d = Math.abs(new Date(t.startDate!).getTime() - now)
    if (d < bestDist) { nearest = t; bestDist = d }
  }
  return new Date(nearest.startDate!)
}

function create(): void {
  if (!mount.value) return
  dispose()

  dataset = new DataSet<DataItem>(visibleTasks.value.map(toItem))

  const center = initialCenter(visibleTasks.value, viewMode.value)
  const win = windowForMode(viewMode.value, center)

  const options: TimelineOptions = {
    height: '100%',
    editable: {
      updateTime: true,
      updateGroup: false,
      add: false,
      remove: false,
      overrideItems: true,
    },
    selectable: true,
    itemsAlwaysDraggable: { item: true, range: true },
    stack: true,
    // We render today as a full-day column highlight + custom marker at noon,
    // so the default (live-updating, midnight-based) current-time line is off.
    showCurrentTime: false,
    zoomable: true,
    horizontalScroll: true,
    verticalScroll: false,
    zoomKey: 'ctrlKey',
    moveable: true,
    // Drag/resize step = 1 day: round any mouse position to midnight.
    snap: (date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d
    },
    // `item: 10` is applied by vis-timeline to BOTH vertical and horizontal
    // gaps — meaning bars within 10px of each other are bumped to different
    // rows. We only want vertical spacing; horizontal: 0 lets adjacent
    // non-overlapping bars share a row. Visual gap is drawn via CSS border.
    margin: { item: { horizontal: 0, vertical: 10 }, axis: 16 },
    orientation: { axis: 'top', item: 'top' },
    // Longest bars sit at the top of each stack — easier to read, less eye travel
    // to the dominant work item.
    order: (a, b) => durationMs(b) - durationMs(a),
    onMove: (item, callback) => {
      if (!item.id || !item.start || !item.end) {
        callback(null)
        return
      }
      const start = toDate(item.start)
      const end = toDate(item.end)
      if (end.getTime() <= start.getTime()) {
        callback(null)
        return
      }
      skipNextClick = true
      suppressNextSync = true
      // Restore the 1ms subtracted in toItem so the canonical end is back on
      // the day boundary (matches how we create tasks from the quick-add).
      const restoredEnd = new Date(end.getTime() + 1)
      tasksStore
        .update(String(item.id), {
          startDate: start.toISOString(),
          dueDate: restoredEnd.toISOString(),
        })
        .then(() => callback(item))
        .catch((e) => {
          console.error('Failed to update dates', e)
          suppressNextSync = false
          callback(null)
        })
    },
    start: win.start,
    end: win.end,
  }

  timeline = new Timeline(mount.value, dataset, options)

  // Custom "today" marker rendered at noon so the vertical line visually
  // bisects the day column (we operate in 1-day steps).
  timeline.addCustomTime(noonToday(), 'hule-today')

  // vis-timeline positions today-marker from the very top of the container,
  // so we need to know the axis height to push the visible portion below.
  timeline.on('changed', syncAxisHeight)
  requestAnimationFrame(syncAxisHeight)

  timeline.on('click', (ev) => {
    if (skipNextClick) {
      skipNextClick = false
      return
    }
    if (ev.item == null) return
    if (ev.what !== 'item') return
    openTaskId.value = String(ev.item)
  })

  requestAnimationFrame(() => { timeline?.redraw() })
}

function syncData(): void {
  if (!dataset) { create(); return }
  const next = visibleTasks.value.map(toItem)
  const nextIds = new Set(next.map(i => String(i.id)))
  const currentIds = dataset.getIds().map(String)
  const toRemove = currentIds.filter(id => !nextIds.has(id))
  if (toRemove.length > 0) dataset.remove(toRemove)
  if (next.length > 0) dataset.update(next)
}

function dispose(): void {
  if (timeline) { timeline.destroy(); timeline = null }
  if (dataset) { dataset.clear(); dataset = null }
}

function toDate(v: Date | string | number): Date {
  return v instanceof Date ? v : new Date(v)
}

function durationMs(item: DataItem): number {
  const s = item.start instanceof Date ? item.start.getTime() : new Date(item.start as string | number).getTime()
  const e = item.end instanceof Date ? item.end.getTime() : new Date((item.end ?? item.start) as string | number).getTime()
  return e - s
}

function noonToday(): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d
}

/** Keep the today-marker aligned with the axis:
 *  - vis-timeline inserts `.vis-custom-time` at the very top of the full
 *    timeline container, so the top portion runs under the axis strip. We
 *    measure axis height and expose it as `--axis-h` so CSS can push the
 *    visible line + dot cap below the axis.
 *  Runs on every `changed` event (redraws can resize the axis). */
function syncAxisHeight(): void {
  const root = mount.value
  if (!root) return
  const center = root.querySelector<HTMLElement>('.vis-panel.vis-center')
  const vertBg = root.querySelector<HTMLElement>('.vis-panel.vis-background.vis-vertical')
  if (!center || !vertBg) return
  const h = center.getBoundingClientRect().top - vertBg.getBoundingClientRect().top
  if (h > 0) root.style.setProperty('--axis-h', `${h}px`)
}

const GHOST_HEIGHT = 28
// Mirror vis-timeline's `margin: { item: 10, axis: 16 }` — the ghost snaps to
// the same row grid as real items so it slots in cleanly instead of drifting
// mid-row and clipping neighbours.
const ITEM_VMARGIN = 10
const AXIS_VMARGIN = 16
const ROW_STRIDE = GHOST_HEIGHT + ITEM_VMARGIN

function hideGhost(): void {
  // While the quick-add popover is open, the ghost stays pinned to the
  // popover's target day — otherwise it would vanish the moment the user's
  // cursor left the timeline (e.g. moved into the popover input).
  if (popoverOpen.value) return
  ghostVisible.value = false
  ghostDay.value = null
}

/** Ghost bar tracks the cursor: X snaps to the cursor's day column, Y
 *  follows the cursor freely so the ghost appears under the mouse instead
 *  of being stuck at the top. Hidden over bars, the axis, and while the
 *  popover is open (ghost is pinned to the selected day separately). */
function onMouseMove(e: MouseEvent): void {
  if (!timeline || !mount.value) return
  if (popoverOpen.value) return

  const target = e.target as HTMLElement | null
  if (!target) return hideGhost()
  if (target.closest('.vis-item')) return hideGhost()
  if (target.closest('.vis-time-axis')) return hideGhost()

  const centerPanel = mount.value.querySelector<HTMLElement>('.vis-panel.vis-center')
  if (!centerPanel) return hideGhost()

  const cRect = centerPanel.getBoundingClientRect()
  if (e.clientX < cRect.left || e.clientX > cRect.right) return hideGhost()
  if (e.clientY < cRect.top || e.clientY > cRect.bottom) return hideGhost()

  const win = timeline.getWindow()
  const winStart = win.start.valueOf()
  const winEnd = win.end.valueOf()
  const windowMs = winEnd - winStart
  if (windowMs <= 0) return hideGhost()

  const pxPerMs = cRect.width / windowMs
  const ratio = (e.clientX - cRect.left) / cRect.width
  const cursorMs = winStart + ratio * windowMs
  const day = new Date(cursorMs)
  day.setHours(0, 0, 0, 0)

  const mRect = mount.value.getBoundingClientRect()
  const dayLeftMount = cRect.left - mRect.left + (day.getTime() - winStart) * pxPerMs
  const dayWidth = DAY_MS * pxPerMs
  const dayLeftVp = mRect.left + dayLeftMount
  const dayRightVp = dayLeftVp + dayWidth

  // Snap ghostTop to the item row grid (row 0 top = AXIS_VMARGIN, stride = ROW_STRIDE).
  const cursorPanelY = e.clientY - cRect.top
  const offsetFromAxis = cursorPanelY - AXIS_VMARGIN
  let slot = Math.max(0, Math.floor(offsetFromAxis / ROW_STRIDE))
  // Hide the ghost when the cursor is in the inter-row margin (the 10px gap
  // between stacked bars) — otherwise `floor` would map the cursor to the
  // previous slot and the ghost would drift onto it.
  const offsetWithinSlot = offsetFromAxis - slot * ROW_STRIDE
  if (offsetFromAxis < 0 || offsetWithinSlot >= GHOST_HEIGHT) return hideGhost()
  const maxSlot = Math.max(0, Math.floor((cRect.height - AXIS_VMARGIN - GHOST_HEIGHT) / ROW_STRIDE))

  // Walk down to the first unoccupied slot so the ghost never lands on top
  // of an existing bar in the same day column (happens when the cursor is
  // very close to — but not over — a bar and the row snap would collide).
  const bars = mount.value.querySelectorAll<HTMLElement>('.vis-item.hule-bar')
  while (slot <= maxSlot && slotOccupied(bars, cRect, dayLeftVp, dayRightVp, slot)) {
    slot++
  }
  const slotPanelTop = AXIS_VMARGIN + slot * ROW_STRIDE
  const maxSlotTop = cRect.height - GHOST_HEIGHT - 4

  // Match the 5px inset used by .hule-bar::before so the ghost aligns
  // pixel-for-pixel with real items instead of spanning the full day column.
  ghostLeft.value = dayLeftMount + 5
  ghostWidth.value = dayWidth - 10
  ghostTop.value = cRect.top - mRect.top + Math.min(maxSlotTop, slotPanelTop)
  ghostDay.value = day
  ghostVisible.value = true
}

/** True if any `.hule-bar` whose X-range overlaps the given day column
 *  already occupies the given row slot (same Y band). A 2px tolerance on
 *  the horizontal bounds absorbs the subpixel drift between the computed
 *  day edge (derived from the timeline window) and the DOM positions of
 *  bars — otherwise a bar ending at exactly the next day's start can leak
 *  into that day's occupancy check and push the ghost too far down. */
function slotOccupied(
  bars: NodeListOf<HTMLElement>,
  cRect: DOMRect,
  dayLeftVp: number,
  dayRightVp: number,
  slot: number,
): boolean {
  const EPS = 2
  const slotTop = cRect.top + AXIS_VMARGIN + slot * ROW_STRIDE
  const slotBottom = slotTop + GHOST_HEIGHT
  for (const bar of bars) {
    const br = bar.getBoundingClientRect()
    if (br.right <= dayLeftVp + EPS || br.left >= dayRightVp - EPS) continue
    if (br.bottom <= slotTop || br.top >= slotBottom) continue
    return true
  }
  return false
}

/** Empty-area click inside the center panel opens the quick-add Popover
 *  anchored at the ghost bar. We rely on the mousemove-tracked ghostDay
 *  so the click simply commits the last cursor position. */
function onMountClick(e: MouseEvent): void {
  if (!ghostVisible.value || !ghostDay.value) return
  const target = e.target as HTMLElement | null
  if (!target) return
  if (target.closest('.vis-item')) return
  if (target.closest('.vis-time-axis')) return
  if (target.closest('.hule-ghost') === null && target.closest('.vis-panel.vis-center') === null) return

  popoverDay.value = ghostDay.value
  activeTab.value = 'create'
  findQuery.value = ''
  findSuggestions.value = []
  newTitle.value = ''
  popoverOpen.value = true
  void nextTick(() => {
    popoverRef.value?.show(e, ghostEl.value)
  })
}

function onPopoverHide(): void {
  popoverOpen.value = false
  popoverDay.value = null
  findQuery.value = ''
  findSuggestions.value = []
  newTitle.value = ''
  // Popover gated `hideGhost` — release and clear now that it's closed.
  ghostVisible.value = false
  ghostDay.value = null
}

/** Day range for a single-day bar: [00:00, next day 00:00). Matches the
 *  snap/resize behaviour already in use for existing bars. */
function dayRange(day: Date): { startISO: string; endISO: string } {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start.getTime() + DAY_MS)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

function filterTasks(query: string): void {
  const q = query.trim().toLowerCase()
  const pool = tasksStore
    .getForList(props.listId)
    .filter(t => !t.startDate || !t.dueDate)
  findSuggestions.value = q
    ? pool.filter(t => t.title.toLowerCase().includes(q)).slice(0, 20)
    : pool.slice(0, 20)
}

function searchTasks(ev: AutoCompleteCompleteEvent): void {
  filterTasks(ev.query)
}

function onFindFocus(): void {
  filterTasks('')
}

async function onFindSelect(ev: AutoCompleteOptionSelectEvent): Promise<void> {
  const task = ev.value as Task
  if (!popoverDay.value) return
  const { startISO, endISO } = dayRange(popoverDay.value)
  await tasksStore.update(task.id, { startDate: startISO, dueDate: endISO })
  popoverRef.value?.hide()
}

async function createTask(): Promise<void> {
  const title = newTitle.value.trim()
  if (!title || !popoverDay.value || creating.value) return
  creating.value = true
  try {
    const { startISO, endISO } = dayRange(popoverDay.value)
    await tasksStore.create({
      listId: props.listId,
      title,
      startDate: startISO,
      dueDate: endISO,
    })
    popoverRef.value?.hide()
  } finally {
    creating.value = false
  }
}

function applyViewMode(mode: ViewMode): void {
  if (!timeline) return
  const range = timeline.getWindow()
  const center = new Date((range.start.valueOf() + range.end.valueOf()) / 2)
  const { start, end } = windowForMode(mode, center)
  timeline.setWindow(start, end, { animation: false })
}

function goToday(): void {
  if (!timeline) return
  const { start, end } = windowForMode(viewMode.value, new Date())
  timeline.setWindow(start, end, { animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
}

function fitAll(): void {
  if (!timeline) return
  timeline.fit({ animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
}

onMounted(async () => {
  await tasksStore.loadForList(props.listId)
  create()
  mount.value?.addEventListener('mousemove', onMouseMove)
  mount.value?.addEventListener('mouseleave', hideGhost)
  mount.value?.addEventListener('click', onMountClick)
})

watch(() => props.listId, async id => {
  await tasksStore.loadForList(id)
  create()
})

watch(viewMode, mode => {
  if (!timeline) return
  applyViewMode(mode)
  requestAnimationFrame(() => applyViewMode(mode))
})

watch(visibleTasks, () => {
  if (suppressNextSync) {
    suppressNextSync = false
    return
  }
  syncData()
})

onBeforeUnmount(() => {
  mount.value?.removeEventListener('mousemove', onMouseMove)
  mount.value?.removeEventListener('mouseleave', hideGhost)
  mount.value?.removeEventListener('click', onMountClick)
  dispose()
})
</script>

<template>
  <div class="timeline">
    <div class="toolbar">
      <SelectButton
        v-model="viewMode"
        :options="viewModes"
        size="small"
        :allow-empty="false"
      />
      <button class="tb-btn" @click="goToday">Today</button>
      <button class="tb-btn" @click="fitAll" :disabled="visibleTasks.length === 0">Fit all</button>
      <span class="tb-spacer" />
      <span v-if="visibleTasks.length > 0" class="muted small">
        {{ visibleTasks.length }} {{ visibleTasks.length === 1 ? 'task' : 'tasks' }}
      </span>
    </div>
    <div v-if="visibleTasks.length === 0" class="empty muted">
      No scheduled tasks in this list. Set Start date and Due date on a task to see it here.
    </div>
    <div ref="mount" class="vis-mount">
      <div
        v-show="ghostVisible"
        ref="ghostEl"
        class="hule-ghost"
        :style="{
          left: ghostLeft + 'px',
          top: ghostTop + 'px',
          width: ghostWidth + 'px',
        }"
      />
    </div>
    <Popover ref="popoverRef" append-to="body" @hide="onPopoverHide">
      <div class="qa">
        <div class="qa-tabs">
          <button
            class="qa-tab"
            :class="{ active: activeTab === 'find' }"
            @click="activeTab = 'find'"
          >Find Task</button>
          <button
            class="qa-tab"
            :class="{ active: activeTab === 'create' }"
            @click="activeTab = 'create'"
          >Create Task</button>
          <span class="qa-spacer" />
          <span v-if="popoverDay" class="qa-date muted">
            {{ popoverDay.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) }}
          </span>
        </div>

        <div v-if="activeTab === 'find'" class="qa-body">
          <AutoComplete
            v-model="findQuery"
            :suggestions="findSuggestions"
            option-label="title"
            placeholder="Search undated tasks"
            size="small"
            class="qa-input"
            :min-length="0"
            force-selection
            @complete="searchTasks"
            @option-select="onFindSelect"
            @focus="onFindFocus"
          />
        </div>
        <div v-else class="qa-body">
          <InputText
            v-model="newTitle"
            placeholder="Task name"
            size="small"
            autofocus
            class="qa-input"
            @keydown.enter="createTask"
          />
          <Button
            label="Create Task"
            size="small"
            :disabled="!newTitle.trim() || creating"
            @click="createTask"
          />
        </div>
      </div>
    </Popover>

    <Dialog
      v-model:visible="taskDialogVisible"
      modal
      dismissable-mask
      :show-header="false"
      :style="{ width: '900px', maxWidth: '95vw' }"
      :content-style="{ padding: '24px 32px', maxHeight: '85vh', overflowY: 'auto' }"
    >
      <TaskView
        v-if="openTaskId"
        :space-id="listSpaceId"
        :list-id="props.listId"
        :task-id="openTaskId"
        modal
      />
    </Dialog>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg);
}
.small { font-size: 12px; }
.empty { padding: 32px 16px; }
.tb-spacer { flex: 1; }
.tb-btn {
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}
.tb-btn:hover { background: var(--hover); border-color: var(--text-muted); }
.tb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.vis-mount {
  flex: 1;
  min-height: 0;
  min-width: 0;
  position: relative;
}

/* Quick-add ghost bar — tracks the cursor, snapped to a 1-day column.
   pointer-events:none so mousemove keeps firing on the panel underneath;
   the click handler lives on .vis-mount and commits the last tracked day. */
.hule-ghost {
  position: absolute;
  height: 28px;
  border-radius: 6px;
  background: var(--hover);
  border: 1px dashed var(--text-muted);
  pointer-events: none;
  z-index: 2;
  transition: opacity 0.1s ease;
  opacity: 0.9;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  color: var(--text-muted);
  font-size: 11px;
}
.hule-ghost::before {
  content: 'Click to add';
  margin-left: 8px;
  margin-right: auto;
  font-weight: 500;
}

/* Popover quick-add panel. */
.qa { min-width: 280px; display: flex; flex-direction: column; gap: 10px; }
.qa-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin: 0 -4px;
  padding: 0 4px;
}
.qa-tab {
  background: transparent;
  border: none;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.qa-tab:hover { color: var(--text); }
.qa-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent-primary);
}
.qa-spacer { flex: 1; }
.qa-date { font-size: 12px; }
.qa-body { display: flex; flex-direction: column; gap: 8px; }
.qa-input { width: 100%; }
.qa-input :deep(.p-inputtext) { width: 100%; }
.qa-input :deep(.p-autocomplete-input) { width: 100%; }
</style>

<style>
/* ClickUp-inspired styling for vis-timeline. All non-scoped so it targets the
   class names vis-timeline applies to the host element and children. */

.vis-mount .vis-timeline {
  border: none;
  font-family: inherit;
  background: #fff;
}

/* vis-timeline paints a full-size overlay on init that never tears itself down
   in our setup and swallows clicks / drags / wheel. */
.vis-mount .vis-loading-screen {
  display: none !important;
  pointer-events: none !important;
}

/* ── Axis ─────────────────────────────────────────────────────── */
.vis-mount .vis-time-axis {
  background: #fafbfc;
}
.vis-mount .vis-time-axis .vis-text {
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
  /* vis-timeline already sets each label's width to its interval span
     (inline style). We only need to centre the text inside that box. */
  text-align: center;
  box-sizing: border-box;
}
.vis-mount .vis-time-axis .vis-text.vis-major {
  color: #111827;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-transform: uppercase;
}

/* ── Grid lines ──────────────────────────────────────────────── */
.vis-mount .vis-panel.vis-center,
.vis-mount .vis-panel.vis-top,
.vis-mount .vis-panel.vis-bottom {
  border-color: #e5e7eb;
}
.vis-mount .vis-time-axis .vis-grid.vis-minor {
  border-color: #cbd5e1;
}
.vis-mount .vis-time-axis .vis-grid.vis-major {
  border-color: #94a3b8;
}

/* ── Weekend highlighting — diagonal hatching (subtle but noticeable) ── */
.vis-mount .vis-time-axis .vis-grid.vis-saturday,
.vis-mount .vis-time-axis .vis-grid.vis-sunday {
  background: repeating-linear-gradient(
    -45deg,
    transparent 0 5px,
    rgba(148, 163, 184, 0.22) 5px 6px
  );
}

/* ── Today column highlight ──────────────────────────────────── */
.vis-mount .vis-time-axis .vis-text.vis-today {
  color: var(--accent-today);
  font-weight: 700;
}
.vis-mount .vis-time-axis .vis-grid.vis-today {
  background: rgba(239, 68, 68, 0.08);
}

/* Custom today marker — red vertical line positioned at noon so it bisects
   the current-day column. Sits BEHIND the bars (z-index: 0) so bars stay
   visually primary. pointer-events:none prevents vis-timeline's default
   custom-time drag behaviour (we don't want users dragging "today"). */
.vis-mount .vis-custom-time.hule-today {
  background: transparent;
  width: 2px;
  z-index: 0;
  pointer-events: none;
  overflow: visible;
}
.vis-mount .vis-custom-time.hule-today .vis-custom-time-marker {
  display: none;
}
/* Red vertical line — vis mounts the custom-time element at the very top of
   the container (above the axis). We offset the visible line by the axis
   height (exposed as --axis-h via syncAxisHeight) plus a small gap, so the
   line visually starts just below the axis (ClickUp reference). */
.vis-mount .vis-custom-time.hule-today::before {
  content: '';
  position: absolute;
  top: calc(var(--axis-h, 48px) + 8px);
  left: 0;
  width: 2px;
  height: calc(100% - var(--axis-h, 48px) - 8px);
  background: var(--accent-today);
  border-radius: 1px;
}
/* Red dot cap — sits just under the axis at the head of the line. */
.vis-mount .vis-custom-time.hule-today::after {
  content: '';
  position: absolute;
  top: calc(var(--axis-h, 48px) + 3px);
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-today);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.18);
}

/* ── Bars ────────────────────────────────────────────────────────────
   Tufte (data-ink): bar's essential data is [start, end, status]. We keep
   only one outer shadow (depth cue) and drop the decorative inset highlight.
   Few (color focus on what matters): solid status fill, priority as a thin
   left stripe — second dimension without extra chartjunk. */
/* Outer item is transparent — just a sizing/hit shell. The coloured body
   is drawn by ::before inset 5px, so adjacent bars on the same row leave
   a symmetric 10px-total gap with properly rounded ends (previously the
   transparent-border trick left square corners and showed the white bg).
   z-index: 1 creates a stacking context so ::before's z-index: -1 stays
   scoped to the bar and doesn't fall behind the timeline grid. */
.vis-mount .vis-item.hule-bar {
  background: transparent;
  color: #fff;
  border: none;
  padding: 0 15px;
  box-sizing: border-box;
  height: 28px !important;
  line-height: 28px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: none;
  cursor: pointer;
  transition: filter 0.12s ease;
  overflow: hidden;
  z-index: 1;
  /* IMPORTANT: do NOT set position here — vis-timeline gives .vis-item its own
     positioning (absolute, driven by transform). An override to `relative`
     would kick every bar into document flow and pile them up horizontally. */
}

.vis-mount .vis-item.hule-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 5px;
  right: 5px;
  bottom: 0;
  background: var(--bar-color);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  transition: box-shadow 0.12s ease;
  z-index: -1;
}

.vis-mount .vis-item.hule-bar:hover::before {
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.14);
}
.vis-mount .vis-item.hule-bar:hover {
  filter: brightness(1.04);
}

.vis-mount .vis-item.hule-bar.is-done::before {
  opacity: 0.68;
}

.vis-mount .vis-item.vis-selected.hule-bar::before {
  box-shadow: 0 0 0 2px var(--accent-primary), 0 2px 8px rgba(99, 102, 241, 0.28);
}

/* Priority stripe — painted as an inset 4px shadow on the body pseudo.
   Keeps a single pseudo element responsible for the body, avoiding the
   cascade of border-radius gotchas that bit the previous approach. */
.vis-mount .vis-item.hule-bar.has-priority::before {
  box-shadow:
    inset 4px 0 0 var(--priority-color),
    0 1px 2px rgba(15, 23, 42, 0.08);
}
.vis-mount .vis-item.hule-bar.has-priority:hover::before {
  box-shadow:
    inset 4px 0 0 var(--priority-color),
    0 2px 8px rgba(15, 23, 42, 0.14);
}
.vis-mount .vis-item.vis-selected.hule-bar.has-priority::before {
  box-shadow:
    inset 4px 0 0 var(--priority-color),
    0 0 0 2px var(--accent-primary),
    0 2px 8px rgba(99, 102, 241, 0.28);
}
.vis-mount .vis-item.hule-bar.has-priority {
  padding-left: 19px;  /* 5 gap + 4 stripe + 10 breathing */
}

/* Content: one-line ellipsis (Ware: consistent visual scanning). */
.vis-mount .vis-item.hule-bar .vis-item-content {
  padding: 0;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

/* ── Drag handles (Norman: visible affordance on hover) ─────────────
   ClickUp-style: on hover a small white vertical pill sits flush with each
   end of the bar, signalling "grab here to resize". */
.vis-mount .vis-item.hule-bar .vis-drag-left,
.vis-mount .vis-item.hule-bar .vis-drag-right {
  width: 10px;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 0.12s ease;
}
.vis-mount .vis-item.hule-bar .vis-drag-left { left: 5px; border-radius: 6px 0 0 6px; }
.vis-mount .vis-item.hule-bar .vis-drag-right { right: 5px; border-radius: 0 6px 6px 0; }

.vis-mount .vis-item.hule-bar .vis-drag-left::after,
.vis-mount .vis-item.hule-bar .vis-drag-right::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 14px;
  background: #fff;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
}

.vis-mount .vis-item.hule-bar:hover .vis-drag-left,
.vis-mount .vis-item.hule-bar:hover .vis-drag-right,
.vis-mount .vis-item.vis-selected.hule-bar .vis-drag-left,
.vis-mount .vis-item.vis-selected.hule-bar .vis-drag-right {
  opacity: 1;
}

/* ── Tooltip (Shneiderman: details on demand) ─────────────────────── */
.vis-tooltip {
  background: #0f172a !important;
  color: #f1f5f9 !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 8px 10px !important;
  font-size: 12px !important;
  line-height: 1.45 !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
  max-width: 280px;
}
.vis-tooltip b { color: #fff; }
</style>
