import { useMemo } from 'react'
import {
  useActiveModules,
  useAllModules,
  useGoalTargets,
  useReadingLogs,
  useStudyLogs,
  useTrainingPlans,
  useTrainingSessions,
  useTrainingTypes,
  type Module,
  type TrainingSession,
  type TrainingType,
} from '../../data'
import { trainingProgress, versionForWeek, type TrainingProgress } from '../../domain/weekly'
import { addDaysStr, type DateStr } from '../../lib/dates'

export interface WeekGoals {
  training: TrainingProgress & { sessionsByDay: Map<DateStr, TrainingSession[]> }
  types: TrainingType[]
  typeName: (id: string) => string
  reading: { minutes: number; target: number; byDay: Map<DateStr, number> }
  study: {
    minutes: number
    target: number
    byDay: Map<DateStr, number>
    /** Minuten pro Modul (null = Allgemein), absteigend sortiert */
    byModule: { moduleId: string | null; name: string; minutes: number }[]
  }
  modules: Module[]
}

const addTo = (map: Map<DateStr, number>, key: DateStr, value: number) => map.set(key, (map.get(key) ?? 0) + value)

/** Alles für die Wochenziele einer Woche (Montag). `undefined` während des Ladens. */
export function useWeekGoals(monday: DateStr): WeekGoals | undefined {
  const sunday = addDaysStr(monday, 6)
  const types = useTrainingTypes()
  const plans = useTrainingPlans()
  const sessions = useTrainingSessions(monday, sunday)
  const targets = useGoalTargets()
  const reading = useReadingLogs(monday, sunday)
  const study = useStudyLogs(monday, sunday)
  const modules = useActiveModules()
  const allModules = useAllModules()

  return useMemo(() => {
    if (!types || !plans || !sessions || !targets || !reading || !study || !modules || !allModules) return undefined

    const plan = versionForWeek(plans, monday)
    const sessionsByDay = new Map<DateStr, TrainingSession[]>()
    for (const s of sessions) sessionsByDay.set(s.date, [...(sessionsByDay.get(s.date) ?? []), s])

    const readingTarget = versionForWeek(targets.filter((t) => t.kind === 'reading'), monday)?.minutes ?? 0
    const studyTarget = versionForWeek(targets.filter((t) => t.kind === 'study'), monday)?.minutes ?? 0

    const readingByDay = new Map<DateStr, number>()
    for (const r of reading) addTo(readingByDay, r.date, r.minutes)

    const studyByDay = new Map<DateStr, number>()
    const studyByModule = new Map<string | null, number>()
    for (const s of study) {
      addTo(studyByDay, s.date, s.minutes)
      studyByModule.set(s.moduleId, (studyByModule.get(s.moduleId) ?? 0) + s.minutes)
    }
    const moduleName = (id: string | null) =>
      id == null ? 'Allgemein' : (allModules.find((m) => m.id === id)?.shortName ?? 'Gelöschtes Modul')

    return {
      training: { ...trainingProgress(plan?.targets ?? [], sessions), sessionsByDay },
      types,
      typeName: (id: string) => types.find((t) => t.id === id)?.name ?? 'Unbekannt',
      reading: { minutes: reading.reduce((a, r) => a + r.minutes, 0), target: readingTarget, byDay: readingByDay },
      study: {
        minutes: study.reduce((a, s) => a + s.minutes, 0),
        target: studyTarget,
        byDay: studyByDay,
        byModule: [...studyByModule]
          .filter(([, minutes]) => minutes > 0)
          .map(([moduleId, minutes]) => ({ moduleId, name: moduleName(moduleId), minutes }))
          .sort((a, b) => b.minutes - a.minutes),
      },
      modules,
    }
  }, [types, plans, sessions, targets, reading, study, modules, allModules, monday])
}
