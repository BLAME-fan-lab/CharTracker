import { useMemo } from 'react'
import { useHabitLogs, useHabits, type Habit } from '../../data'
import { DoneIndex, isHabitActiveOn } from '../../domain/habits'
import { addDaysStr, type DateStr } from '../../lib/dates'

export interface HabitData {
  /** nicht archivierte + archivierte Gewohnheiten (nicht gelöscht) */
  habits: Habit[]
  done: DoneIndex
}

/** Lädt Gewohnheiten + Haken und baut den Nachschlage-Index. `undefined` während des Ladens. */
export function useHabitData(): HabitData | undefined {
  const habits = useHabits()
  const logs = useHabitLogs()
  return useMemo(() => {
    if (!habits || !logs) return undefined
    return { habits, done: new DoneIndex(logs) }
  }, [habits, logs])
}

/** Gewohnheiten, die an mindestens einem Tag im Zeitraum aktiv sind. */
export function habitsActiveInRange(habits: Habit[], from: DateStr, to: DateStr): Habit[] {
  return habits.filter((h) => h.activeFrom <= to && (h.archivedFrom == null || h.archivedFrom > from))
}

export function habitsActiveOn(habits: Habit[], date: DateStr): Habit[] {
  return habits.filter((h) => isHabitActiveOn(h, date))
}

export const sundayOf = (monday: DateStr) => addDaysStr(monday, 6)
