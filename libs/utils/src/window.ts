import { DAY_MS } from './date'

export type GanttViewMode = 'week' | 'month' | 'quarter' | 'year'

const DAYS_BY_MODE: Record<GanttViewMode, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
}

export function daysInMode(mode: GanttViewMode): number {
  return DAYS_BY_MODE[mode]
}

export function windowForMode(
  center: Date,
  mode: GanttViewMode,
): { start: Date; end: Date } {
  const days = DAYS_BY_MODE[mode]
  const half = (days * DAY_MS) / 2
  return {
    start: new Date(center.getTime() - half),
    end: new Date(center.getTime() + half),
  }
}
