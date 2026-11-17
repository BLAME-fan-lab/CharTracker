import { addDaysStr, diffDays, isoWeekday, type DateStr } from '../lib/dates'

/** Minimale Sicht auf eine Gewohnheit – reine Logik, unabhängig von der Datenbank. */
export interface HabitSpan {
  id: string
  activeFrom: DateStr
  archivedFrom: DateStr | null
  /** ISO-Wochentage (1 = Mo … 7 = So); fehlt/leer = täglich */
  weekdays?: number[] | null
}

export interface HabitDone {
  habitId: string
  date: DateStr
  done: boolean
}

/** Im Zeitraum (zwischen Start und Archivierung)? Unabhängig vom Wochentag. */
export const isHabitInSpan = (h: HabitSpan, date: DateStr): boolean =>
  h.activeFrom <= date && (h.archivedFrom == null || date < h.archivedFrom)

/** Ist an diesem Wochentag geplant? */
export const isHabitScheduled = (h: HabitSpan, date: DateStr): boolean =>
  !h.weekdays || h.weekdays.length === 0 || h.weekdays.includes(isoWeekday(date))

/** Zählt die Gewohnheit an diesem Tag (Zeitraum und Wochentag)? */
export const isHabitActiveOn = (h: HabitSpan, date: DateStr): boolean => isHabitInSpan(h, date) && isHabitScheduled(h, date)

/** Schneller Nachschlage-Index für erledigte Haken. */
export class DoneIndex {
  private readonly keys = new Set<string>()
  constructor(logs: readonly HabitDone[]) {
    for (const l of logs) if (l.done) this.keys.add(`${l.habitId}|${l.date}`)
  }
  has(habitId: string, date: DateStr): boolean {
    return this.keys.has(`${habitId}|${date}`)
  }
}

export interface DayCompletion {
  active: number
  done: number
  /** 0–1, null wenn an dem Tag keine Gewohnheit aktiv war */
  ratio: number | null
}

export function dayCompletion(habits: readonly HabitSpan[], done: DoneIndex, date: DateStr): DayCompletion {
  let active = 0
  let doneCount = 0
  for (const h of habits) {
    if (!isHabitActiveOn(h, date)) continue
    active++
    if (done.has(h.id, date)) doneCount++
  }
  return { active, done: doneCount, ratio: active === 0 ? null : doneCount / active }
}

const isPerfectDay = (habits: readonly HabitSpan[], done: DoneIndex, date: DateStr): boolean => {
  const c = dayCompletion(habits, done, date)
  return c.active > 0 && c.done === c.active
}

type DayCheck = 'ok' | 'fail' | 'skip'

/**
 * Zählt erfüllte Tage am Stück rückwärts. Tage mit 'skip' (z. B. nicht geplante Wochentage)
 * werden übersprungen. Der heutige Tag bricht die Serie nicht, solange er nicht erfüllt ist.
 */
function countBack(today: DateStr, check: (d: DateStr) => DayCheck, stopBefore: DateStr): number {
  let day = today
  if (check(today) !== 'ok') day = addDaysStr(today, -1)
  let count = 0
  while (day >= stopBefore) {
    const c = check(day)
    if (c === 'fail') break
    if (c === 'ok') count++
    day = addDaysStr(day, -1)
  }
  return count
}

const habitCheck = (habit: HabitSpan, done: DoneIndex) => (d: DateStr): DayCheck => {
  if (!isHabitInSpan(habit, d)) return 'fail'
  if (!isHabitScheduled(habit, d)) return 'skip'
  return done.has(habit.id, d) ? 'ok' : 'fail'
}

/** Aktuelle Serie einer Gewohnheit (bei Wochentags-Gewohnheiten: geplante Tage am Stück). */
export function habitStreak(habit: HabitSpan, done: DoneIndex, today: DateStr): number {
  return countBack(today, habitCheck(habit, done), habit.activeFrom)
}

const earliestStart = (habits: readonly HabitSpan[]): DateStr | null =>
  habits.reduce<DateStr | null>((min, h) => (min == null || h.activeFrom < min ? h.activeFrom : min), null)

/** Aktuelle Serie „perfekter Tage“ (alle an dem Tag aktiven Gewohnheiten erfüllt). */
export function perfectDayStreak(habits: readonly HabitSpan[], done: DoneIndex, today: DateStr): number {
  const start = earliestStart(habits)
  if (start == null) return 0
  return countBack(today, (d) => (isPerfectDay(habits, done, d) ? 'ok' : 'fail'), start)
}

/** Längste Serie zwischen `from` und `to` (inklusive); 'skip'-Tage unterbrechen nicht. */
function longestRun(from: DateStr, to: DateStr, check: (d: DateStr) => DayCheck): number {
  const n = diffDays(to, from)
  let best = 0
  let run = 0
  for (let i = 0; i <= n; i++) {
    const c = check(addDaysStr(from, i))
    if (c === 'ok') {
      run++
      if (run > best) best = run
    } else if (c === 'fail') {
      run = 0
    }
  }
  return best
}

export function bestHabitStreak(habit: HabitSpan, done: DoneIndex, today: DateStr): number {
  return longestRun(habit.activeFrom, today, habitCheck(habit, done))
}

export function bestPerfectDayStreak(habits: readonly HabitSpan[], done: DoneIndex, today: DateStr): number {
  const start = earliestStart(habits)
  if (start == null) return 0
  return longestRun(start, today, (d) => (isPerfectDay(habits, done, d) ? 'ok' : 'fail'))
}
