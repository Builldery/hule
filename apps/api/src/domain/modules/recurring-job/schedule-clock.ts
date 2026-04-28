import { ERecurrenceKind } from '../../entity/recurring-job/recurring-job.constants';

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;

export interface ScheduleSpec {
  kind: ERecurrenceKind;
  timeOfDay: string;
  weekday?: number;
  monthDay?: number;
  monthOfYear?: number;
}

function toLocal(d: Date): Date {
  return new Date(d.getTime() + TZ_OFFSET_MS);
}

function localToUtc(localD: Date): Date {
  return new Date(localD.getTime() - TZ_OFFSET_MS);
}

function buildLocalAt(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
): Date | null {
  const cand = new Date(Date.UTC(y, mo, d, h, mi, 0, 0));
  if (
    cand.getUTCFullYear() !== y ||
    cand.getUTCMonth() !== ((mo % 12) + 12) % 12 ||
    cand.getUTCDate() !== d
  ) {
    return null;
  }
  return cand;
}

function parseTimeOfDay(s: string): { h: number; mi: number } {
  const [hStr, miStr] = s.split(':');
  return { h: Number(hStr), mi: Number(miStr) };
}

export function computeNextRunAt(spec: ScheduleSpec, after: Date): Date {
  const { h, mi } = parseTimeOfDay(spec.timeOfDay);
  const local = toLocal(after);
  const Y = local.getUTCFullYear();
  const M = local.getUTCMonth();
  const D = local.getUTCDate();

  switch (spec.kind) {
    case ERecurrenceKind.Daily: {
      const today = buildLocalAt(Y, M, D, h, mi);
      if (today && today.getTime() > local.getTime()) return localToUtc(today);
      const tomorrow = buildLocalAt(Y, M, D + 1, h, mi)!;
      return localToUtc(tomorrow);
    }
    case ERecurrenceKind.Weekly: {
      const target = spec.weekday!;
      const localIso = ((local.getUTCDay() + 6) % 7) + 1;
      let daysAhead = (target - localIso + 7) % 7;
      if (daysAhead === 0) {
        const today = buildLocalAt(Y, M, D, h, mi);
        if (today && today.getTime() <= local.getTime()) daysAhead = 7;
      }
      const cand = buildLocalAt(Y, M, D + daysAhead, h, mi)!;
      return localToUtc(cand);
    }
    case ERecurrenceKind.Monthly: {
      const targetDay = spec.monthDay!;
      let m = M;
      let y = Y;
      let cand = buildLocalAt(y, m, targetDay, h, mi);
      if (!cand || cand.getTime() <= local.getTime()) {
        for (let i = 0; i < 24; i++) {
          m += 1;
          if (m > 11) {
            m = 0;
            y += 1;
          }
          cand = buildLocalAt(y, m, targetDay, h, mi);
          if (cand && cand.getTime() > local.getTime()) break;
          cand = null;
        }
      }
      if (!cand) throw new Error('Cannot resolve monthly schedule');
      return localToUtc(cand);
    }
    case ERecurrenceKind.Yearly: {
      const targetMo = spec.monthOfYear! - 1;
      const targetD = spec.monthDay!;
      let y = Y;
      let cand = buildLocalAt(y, targetMo, targetD, h, mi);
      while (!cand || cand.getTime() <= local.getTime()) {
        y += 1;
        cand = buildLocalAt(y, targetMo, targetD, h, mi);
        if (y > Y + 8) throw new Error('Cannot resolve yearly schedule');
      }
      return localToUtc(cand);
    }
  }
  throw new Error(`Unknown recurrence kind: ${spec.kind}`);
}

export function localCalendarDay(d: Date): { year: number; month: number; day: number } {
  const local = toLocal(d);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
  };
}

export function localStartOfDay(d: Date): Date {
  const local = toLocal(d);
  const startLocal = new Date(
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  return localToUtc(startLocal);
}

export function localEndOfDay(d: Date): Date {
  const local = toLocal(d);
  const endLocal = new Date(
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  return localToUtc(endLocal);
}
