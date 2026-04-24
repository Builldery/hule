import type { DataItem } from 'vis-timeline/standalone'
import type { Task } from '@hule/types'
import { DAY_MS, escapeHtml } from '@hule/utils'
import { statusMeta, priorityMeta } from '@/task/constants/tasks'

// `dueDate` is the last inclusive day. Bar ends at that day's 23:59:59.999 so
// Apr 23 → Apr 24 spans both columns, and same-day tasks still fill one column.
// The trailing 1ms also keeps vis-timeline from treating edge-touching items
// (a.end === b.start) as overlapping and bumping them to different rows.
function endOfDay(iso: string): Date {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return new Date(d.getTime() + DAY_MS - 1)
}

// The 3-day view resizes at hour granularity and stores the hour-precise end
// directly. For those tasks we render the bar to the stored time; anything
// saved at midnight keeps the day-level "end of last inclusive day" semantics.
function resolveEnd(iso: string): Date {
  const d = new Date(iso)
  const atMidnight = d.getHours() === 0 && d.getMinutes() === 0
    && d.getSeconds() === 0 && d.getMilliseconds() === 0
  return atMidnight ? endOfDay(iso) : d
}

/** Convert a `Task` with both dates set to a vis-timeline DataItem. */
export function toDataItem(t: Task): DataItem {
  const s = statusMeta(t.status)
  const p = priorityMeta(t.priority)
  const done = t.status === 'done'
  const hasPriority = t.priority !== 'none'
  return {
    id: t.id,
    content: escapeHtml(t.title),
    start: new Date(t.startDate!),
    end: resolveEnd(t.dueDate!),
    type: 'range',
    editable: { updateTime: true, updateGroup: false, remove: false },
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

export function durationMs(item: DataItem): number {
  const s = item.start instanceof Date ? item.start.getTime() : new Date(item.start as string | number).getTime()
  const e = item.end instanceof Date ? item.end.getTime() : new Date((item.end ?? item.start) as string | number).getTime()
  return e - s
}
