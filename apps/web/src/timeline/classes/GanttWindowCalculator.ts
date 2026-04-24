import type { Task } from '@hule/types'
import { DAY_MS } from '@hule/utils'

export type ViewMode = 'Days3' | 'Week' | 'Weeks2' | 'Month' | 'Year'
export const VIEW_MODES: ViewMode[] = ['Days3', 'Week', 'Weeks2', 'Month', 'Year']

export const DAYS_IN_VIEW: Record<ViewMode, number> = {
  Days3: 3,
  Week: 7,
  Weeks2: 14,
  Month: 30,
  Year: 365,
}

export const VIEW_MODE_LABEL: Record<ViewMode, string> = {
  Days3: '3 days',
  Week: 'Week',
  Weeks2: '2 weeks',
  Month: 'Month',
  Year: 'Year',
}

export function windowForMode(mode: ViewMode, center: Date = new Date()): { start: Date; end: Date } {
  const halfMs = (DAYS_IN_VIEW[mode] * DAY_MS) / 2
  return {
    start: new Date(center.getTime() - halfMs),
    end: new Date(center.getTime() + halfMs),
  }
}

/** Choose an initial center:
 *   - today, if any task overlaps the default window;
 *   - otherwise, the start date of the task closest in time to today.
 */
export function initialCenter(tasks: Task[], mode: ViewMode): Date {
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
  let nearest = tasks[0]
  let bestDist = Math.abs(new Date(nearest.startDate!).getTime() - now)
  for (const t of tasks) {
    const d = Math.abs(new Date(t.startDate!).getTime() - now)
    if (d < bestDist) { nearest = t; bestDist = d }
  }
  return new Date(nearest.startDate!)
}

export function noonToday(): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d
}
