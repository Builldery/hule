import type { DataItem } from 'vis-timeline/standalone'
import type { Task } from '@hule/types'
import { escapeHtml } from '@hule/utils'
import { statusMeta, priorityMeta } from '@/task/constants/tasks'

const DATE_FMT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

/** Convert a `Task` with both dates set to a vis-timeline DataItem. */
export function toDataItem(t: Task): DataItem {
  const s = statusMeta(t.status)
  const p = priorityMeta(t.priority)
  const done = t.status === 'done'
  const hasPriority = t.priority !== 'none'
  const fmt = (iso: string): string => new Date(iso).toLocaleDateString(undefined, DATE_FMT)
  const title = [
    `<b>${escapeHtml(t.title)}</b>`,
    `${fmt(t.startDate!)} → ${fmt(t.dueDate!)}`,
    `Status: ${s.label}${hasPriority ? ` · Priority: ${p.label}` : ''}`,
  ].join('<br>')
  // Shrink end by 1ms: vis-timeline treats edge-touching items
  // (a.end === b.start) as overlapping and bumps them to different rows.
  // `onMove` adds the 1ms back before persisting.
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

export function durationMs(item: DataItem): number {
  const s = item.start instanceof Date ? item.start.getTime() : new Date(item.start as string | number).getTime()
  const e = item.end instanceof Date ? item.end.getTime() : new Date((item.end ?? item.start) as string | number).getTime()
  return e - s
}
