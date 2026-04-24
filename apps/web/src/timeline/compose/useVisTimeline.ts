import { onBeforeUnmount, shallowRef, type Ref, type ShallowRef } from 'vue'
import { Timeline, DataSet, type TimelineOptions, type DataItem } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.css'
import { durationMs } from '../classes/GanttItemBuilder'

export interface UseVisTimelineOptions {
  mountRef: Ref<HTMLDivElement | null>
  window: { start: Date; end: Date }
  onItemMove: (id: string, start: Date, end: Date) => Promise<void>
  onItemClick: (id: string) => void
}

export interface UseVisTimelineReturn {
  timeline: ShallowRef<Timeline | null>
  dataset: ShallowRef<DataSet<DataItem> | null>
  create(items: DataItem[], win: { start: Date; end: Date }): void
  syncData(items: DataItem[]): void
  setWindow(start: Date, end: Date, animate?: boolean): void
  fit(): void
  dispose(): void
}

/** Owns the vis-timeline instance + its DataSet. Idempotent disposal so HMR
 *  reloads don't leave ghost timelines on the mount. */
export function useVisTimeline(opts: UseVisTimelineOptions): UseVisTimelineReturn {
  const timeline = shallowRef<Timeline | null>(null)
  const dataset = shallowRef<DataSet<DataItem> | null>(null)
  let skipNextClick = false
  let detachDragListeners: (() => void) | null = null

  function toDate(v: Date | string | number): Date {
    return v instanceof Date ? v : new Date(v)
  }

  function dispose(): void {
    if (detachDragListeners) { detachDragListeners(); detachDragListeners = null }
    if (timeline.value) { timeline.value.destroy(); timeline.value = null }
    if (dataset.value) { dataset.value.clear(); dataset.value = null }
  }

  function create(items: DataItem[], win: { start: Date; end: Date }): void {
    if (!opts.mountRef.value) return
    dispose()

    const ds = new DataSet<DataItem>(items)
    dataset.value = ds

    const mount = opts.mountRef.value
    // vis-timeline resets `el.className` on every redraw (see Item.redraw in
    // vis source), so a plain classList.add gets wiped mid-drag. We re-apply
    // the active class via a MutationObserver on the class attribute.
    let activeBar: HTMLElement | null = null
    const activeObserver = new MutationObserver(() => {
      if (activeBar && !activeBar.classList.contains('hule-active')) {
        activeBar.classList.add('hule-active')
      }
    })
    const clearActiveBar = (): void => {
      activeObserver.disconnect()
      if (activeBar) { activeBar.classList.remove('hule-active'); activeBar = null }
    }
    const markActiveBar = (e: PointerEvent): void => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const bar = target.closest<HTMLElement>('.vis-item.hule-bar')
      if (!bar) return
      clearActiveBar()
      bar.classList.add('hule-active')
      activeBar = bar
      activeObserver.observe(bar, { attributes: true, attributeFilter: ['class'] })
    }

    const options: TimelineOptions = {
      height: '100%',
      editable: { updateTime: true, updateGroup: false, add: false, remove: false, overrideItems: true },
      selectable: true,
      itemsAlwaysDraggable: { item: true, range: true },
      stack: true,
      // We paint our own today marker at noon — disable vis's live midnight line.
      showCurrentTime: false,
      zoomable: true,
      horizontalScroll: true,
      verticalScroll: false,
      zoomKey: 'ctrlKey',
      moveable: true,
      // vis's `snap` has no edge context — we snap in `onMoving` instead so
      // left/right resize can use different rules (see below).
      snap: (date) => date,
      // item: horizontal 0 so adjacent non-overlapping bars share a row;
      // vertical 10 + axis 16 matches the ghost-bar row grid.
      margin: { item: { horizontal: 0, vertical: 10 }, axis: 16 },
      orientation: { axis: 'top', item: 'top' },
      // Longer bars on top — less eye travel to the dominant work item.
      order: (a, b) => durationMs(b) - durationMs(a),
      // Drag step = 1 day with edge-aware rules:
      // - left-edge resize: floor start to midnight (touching day N-1 → extend).
      // - right-edge resize: ceil end to next midnight − 1ms (touching day N+1
      //   → extend). Symmetric with the left edge; without this, users have to
      //   drag the right edge all the way into day N+2 before the bar grows.
      // - whole-bar move: floor start, preserve duration.
      onMoving: (item, callback) => {
        if (!item.id || !item.start || !item.end) { callback(null); return }
        const prev = ds.get(String(item.id))
        if (!prev || !prev.start || !prev.end) { callback(item); return }

        const prevStart = toDate(prev.start)
        const prevEnd = toDate(prev.end)
        const newStart = toDate(item.start)
        const newEnd = toDate(item.end)

        const startMoved = newStart.getTime() !== prevStart.getTime()
        const endMoved = newEnd.getTime() !== prevEnd.getTime()

        const floorDay = (d: Date): Date => {
          const x = new Date(d); x.setHours(0, 0, 0, 0); return x
        }
        // Preserves the dataset's `dueDate − 1ms` convention from toDataItem.
        const ceilDayMinus1Ms = (d: Date): Date => {
          const x = new Date(d)
          const atMidnight = x.getHours() === 0 && x.getMinutes() === 0
            && x.getSeconds() === 0 && x.getMilliseconds() === 0
          x.setHours(0, 0, 0, 0)
          if (!atMidnight) x.setDate(x.getDate() + 1)
          return new Date(x.getTime() - 1)
        }

        if (startMoved && endMoved) {
          const duration = prevEnd.getTime() - prevStart.getTime()
          const snapped = floorDay(newStart)
          item.start = snapped
          item.end = new Date(snapped.getTime() + duration)
        } else if (startMoved) {
          item.start = floorDay(newStart)
        } else if (endMoved) {
          item.end = ceilDayMinus1Ms(newEnd)
        }
        callback(item)
      },
      onMove: (item, callback) => {
        if (!item.id || !item.start || !item.end) { callback(null); return }
        const start = toDate(item.start)
        const end = toDate(item.end)
        if (end.getTime() <= start.getTime()) { callback(null); return }
        skipNextClick = true
        // Restore the 1ms stripped in toDataItem so the canonical end is back
        // on the day boundary (matches how we create tasks from quick-add).
        const restoredEnd = new Date(end.getTime() + 1)
        opts
          .onItemMove(String(item.id), start, restoredEnd)
          .then(() => callback(item))
          .catch((e) => {
            console.error('Failed to update dates', e)
            callback(null)
          })
      },
      start: win.start,
      end: win.end,
    }

    const tl = new Timeline(opts.mountRef.value, ds, options)
    timeline.value = tl

    tl.on('click', (ev) => {
      if (skipNextClick) { skipNextClick = false; return }
      if (ev.item == null || ev.what !== 'item') return
      opts.onItemClick(String(ev.item))
    })

    mount.addEventListener('pointerdown', markActiveBar)
    document.addEventListener('pointerup', clearActiveBar)
    document.addEventListener('pointercancel', clearActiveBar)
    detachDragListeners = () => {
      mount.removeEventListener('pointerdown', markActiveBar)
      document.removeEventListener('pointerup', clearActiveBar)
      document.removeEventListener('pointercancel', clearActiveBar)
      clearActiveBar()
    }

    requestAnimationFrame(() => { tl.redraw() })
  }

  function syncData(items: DataItem[]): void {
    const ds = dataset.value
    if (!ds) return
    const nextIds = new Set(items.map(i => String(i.id)))
    const currentIds = ds.getIds().map(String)
    const toRemove = currentIds.filter(id => !nextIds.has(id))
    if (toRemove.length > 0) ds.remove(toRemove)
    if (items.length > 0) ds.update(items)
  }

  function setWindow(start: Date, end: Date, animate = false): void {
    timeline.value?.setWindow(start, end, animate ? { animation: { duration: 200, easingFunction: 'easeInOutQuad' } } : { animation: false })
  }

  function fit(): void {
    timeline.value?.fit({ animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
  }

  onBeforeUnmount(dispose)

  return { timeline, dataset, create, syncData, setWindow, fit, dispose }
}
