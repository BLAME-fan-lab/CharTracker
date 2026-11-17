import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getISOWeek,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { de } from 'date-fns/locale'

/**
 * Kalendertag als 'YYYY-MM-DD' in lokaler Zeit.
 * Bewusst ein String statt Date: keine Zeitzonen-Fallen, sortierbar, direkt als DB-Schlüssel nutzbar.
 */
export type DateStr = string

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const toDateStr = (d: Date): DateStr => format(d, 'yyyy-MM-dd')
/** parseISO interpretiert reine Datumsangaben als lokale Mitternacht. */
export const fromDateStr = (s: DateStr): Date => parseISO(s)
export const todayStr = (): DateStr => toDateStr(new Date())

export const isValidDateStr = (s: unknown): s is DateStr =>
  typeof s === 'string' && DATE_RE.test(s) && isValid(parseISO(s))

export const addDaysStr = (s: DateStr, n: number): DateStr => toDateStr(addDays(fromDateStr(s), n))

/** Montag der Woche, in der s liegt. */
export const weekStartOf = (s: DateStr): DateStr =>
  toDateStr(startOfWeek(fromDateStr(s), { weekStartsOn: 1 }))

/** Die sieben Tage (Mo–So) ab einem Montag. */
export const weekDays = (monday: DateStr): DateStr[] =>
  Array.from({ length: 7 }, (_, i) => addDaysStr(monday, i))

/** a − b in Kalendertagen (positiv, wenn a nach b liegt). */
export const diffDays = (a: DateStr, b: DateStr): number =>
  differenceInCalendarDays(fromDateStr(a), fromDateStr(b))

/** Alle Tage von from bis to (inklusive). */
export function daysInRange(from: DateStr, to: DateStr): DateStr[] {
  const n = diffDays(to, from)
  if (n < 0) return []
  return Array.from({ length: n + 1 }, (_, i) => addDaysStr(from, i))
}

export const isoWeek = (s: DateStr): number => getISOWeek(fromDateStr(s))

export const fmt = (s: DateStr, pattern: string): string =>
  format(fromDateStr(s), pattern, { locale: de })

/** Monat als 'YYYY-MM'. */
export type MonthStr = string
export const monthOf = (s: DateStr): MonthStr => s.slice(0, 7)
export const monthStart = (m: MonthStr): DateStr => `${m}-01`
export const monthEnd = (m: MonthStr): DateStr => toDateStr(endOfMonth(fromDateStr(monthStart(m))))
export const addMonthsStr = (m: MonthStr, n: number): MonthStr =>
  format(addMonths(startOfMonth(fromDateStr(monthStart(m))), n), 'yyyy-MM')
export const isValidMonthStr = (s: unknown): s is MonthStr =>
  typeof s === 'string' && /^\d{4}-\d{2}$/.test(s) && isValidDateStr(`${s}-01`)

/** z. B. „16.–22. Nov. 2026“ oder „30. Nov. – 6. Dez. 2026“ */
export function formatWeekRange(monday: DateStr): string {
  const sunday = addDaysStr(monday, 6)
  const sameMonth = monthOf(monday) === monthOf(sunday)
  const sameYear = monday.slice(0, 4) === sunday.slice(0, 4)
  if (sameMonth) return `${fmt(monday, 'd.')}–${fmt(sunday, 'd. MMM yyyy')}`
  if (sameYear) return `${fmt(monday, 'd. MMM')} – ${fmt(sunday, 'd. MMM yyyy')}`
  return `${fmt(monday, 'd. MMM yyyy')} – ${fmt(sunday, 'd. MMM yyyy')}`
}

/** Kurzform Wochentag: „Mo“, „Di“, … */
export const weekdayShort = (s: DateStr): string => fmt(s, 'EEEEEE')
