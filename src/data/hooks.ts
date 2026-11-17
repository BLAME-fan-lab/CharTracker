import { useLiveQuery } from 'dexie-react-hooks'
import { listHabitLogs, listHabits } from './repo/habits'
import { getSettings } from './repo/settings'

/*
 * Reaktive Lese-Hooks. Sie liefern `undefined`, solange die Daten laden,
 * und aktualisieren sich automatisch bei jeder Änderung in der Datenbank.
 */

export const useHabits = () => useLiveQuery(listHabits, [])
export const useHabitLogs = () => useLiveQuery(listHabitLogs, [])
export const useSettings = () => useLiveQuery(getSettings, [])
