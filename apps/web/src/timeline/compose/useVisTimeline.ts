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

  function toDate(v: Date | string | number): Date {
    return v instanceof Date ? v : new Date(v)
  }

  function dispose(): void {
    if (timeline.value) { timeline.value.destroy(); timeline.value = null }
    if (dataset.value) { dataset.value.clear(); dataset.value = null }
  }

  function create(items: DataItem[], win: { start: Date; end: Date }): void {
    if (!opts.mountRef.value) return
    dispose()

    const ds = new DataSet<DataItem>(items)
    dataset.value = ds

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
      // Drag/resize step = 1 day: round any mouse position to midnight.
      snap: (date) => {
        const d = new Date(date)
        d.setHours(0, 0, 0, 0)
        return d
      },
      // item: horizontal 0 so adjacent non-overlapping bars share a row;
      // vertical 10 + axis 16 matches the ghost-bar row grid.
      margin: { item: { horizontal: 0, vertical: 10 }, axis: 16 },
      orientation: { axis: 'top', item: 'top' },
      // Longer bars on top — less eye travel to the dominant work item.
      order: (a, b) => durationMs(b) - durationMs(a),
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
