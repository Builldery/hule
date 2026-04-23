export const DAY_MS = 24 * 60 * 60 * 1000

export function snapToMidnight(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function noonToday(base: Date = new Date()): Date {
  const x = new Date(base)
  x.setHours(12, 0, 0, 0)
  return x
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function formatShort(d: Date, locale = 'ru-RU'): string {
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
}

export function formatRange(start: Date, end: Date, locale = 'ru-RU'): string {
  return `${formatShort(start, locale)} — ${formatShort(end, locale)}`
}
