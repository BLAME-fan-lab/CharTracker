import { addDaysStr, diffDays, type DateStr } from '../lib/dates'

/** Minimale Sicht auf eine Gewohnheit – reine Logik, unabhängig von der Datenbank. */
export interface HabitSpan {
  id: string
  activeFrom: DateStr
  archivedFrom: DateStr | null
}

export interface HabitDone {
  habitId: string
  date: DateStr
  done: boolean
}

export const isHabitActiveOn = (h: HabitSpan, date: DateStr): boolean =>
  h.activeFrom <= date && (h.archivedFrom == null || date < h.archivedFrom)

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

/**
 * Zählt Tage am Stück rückwärts. Der heutige Tag bricht die Serie nicht,
 * solange er nicht erfüllt ist – dann wird ab gestern gezählt.
 */
function countBack(today: DateStr, ok: (d: DateStr) => boolean, stopBefore: DateStr): number {
  let day = ok(today) ? today : addDaysStr(today, -1)
  let count = 0
  while (day >= stopBefore && ok(day)) {
    count++
    day = addDaysStr(day, -1)
  }
  return count
}

/** Aktuelle Serie einer Gewohnheit. */
export function habitStreak(habit: HabitSpan, done: DoneIndex, today: DateStr): number {
  return countBack(today, (d) => isHabitActiveOn(habit, d) && done.has(habit.id, d), habit.activeFrom)
}

const earliestStart = (habits: readonly HabitSpan[]): DateStr | null =>
  habits.reduce<DateStr | null>((min, h) => (min == null || h.activeFrom < min ? h.activeFrom : min), null)

/** Aktuelle Serie „perfekter Tage“ (alle an dem Tag aktiven Gewohnheiten erfüllt). */
export function perfectDayStreak(habits: readonly HabitSpan[], done: DoneIndex, today: DateStr): number {
  const start = earliestStart(habits)
  if (start == null) return 0
  return countBack(today, (d) => isPerfectDay(habits, done, d), start)
}

/** Längste Serie zwischen `from` und `to` (inklusive). */
function longestRun(from: DateStr, to: DateStr, ok: (d: DateStr) => boolean): number {
  const n = diffDays(to, from)
  let best = 0
  let run = 0
  for (let i = 0; i <= n; i++) {
    if (ok(addDaysStr(from, i))) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

export function bestHabitStreak(habit: HabitSpan, done: DoneIndex, today: DateStr): number {
  return longestRun(habit.activeFrom, today, (d) => isHabitActiveOn(habit, d) && done.has(habit.id, d))
}

export function bestPerfectDayStreak(habits: readonly HabitSpan[], done: DoneIndex, today: DateStr): number {
  const start = earliestStart(habits)
  if (start == null) return 0
  return longestRun(start, today, (d) => isPerfectDay(habits, done, d))
}
