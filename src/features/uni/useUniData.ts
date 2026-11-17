import { useMemo } from 'react'
import {
  useActiveModules,
  useActiveSemester,
  useSettings,
  useStudyLogs,
  useStudyUnits,
  type Module,
  type Semester,
  type StudyUnit,
} from '../../data'
import { moduleProgress, overallProgress, type ModuleProgress, type UniConfig } from '../../domain/uni'
import { addDaysStr, weekStartOf, type DateStr } from '../../lib/dates'

export interface ModuleView {
  module: Module
  order: number
  units: StudyUnit[]
  progress: ModuleProgress
  /** gelernte Minuten im Semester */
  studyMinutes: number
  /** gelernte Minuten in der laufenden Woche */
  studyMinutesWeek: number
}

export interface UniData {
  semester: Semester
  config: UniConfig
  modules: ModuleView[]
  overall: ReturnType<typeof overallProgress>
}

/** Alles für den Uni-Bereich, inkl. Soll/Ist pro Modul. `undefined` = lädt, `null` = kein Semester. */
export function useUniData(today: DateStr): UniData | null | undefined {
  const semester = useActiveSemester()
  const modules = useActiveModules()
  const units = useStudyUnits()
  const settings = useSettings()
  const logs = useStudyLogs(semester?.start ?? '0000-01-01', semester?.end ?? '0000-01-01')

  return useMemo(() => {
    if (semester === null) return null
    if (!semester || !modules || !units || !settings || !logs) return undefined
    const config: UniConfig = {
      sollStart: semester.lectureStart,
      semesterTarget: semester.targetDate,
      bufferDays: settings.studyBufferDays,
      tolerancePp: settings.statusTolerancePp,
      breaks: semester.breaks,
      pauseInBreaks: settings.pauseSollInBreaks,
    }
    const monday = weekStartOf(today)
    const sunday = addDaysStr(monday, 6)
    const views: ModuleView[] = modules.map((m) => {
      const moduleUnits = units.filter((u) => u.moduleId === m.id)
      const moduleLogs = logs.filter((l) => l.moduleId === m.id)
      return {
        module: m,
        order: m.order,
        units: moduleUnits,
        progress: moduleProgress(m, moduleUnits, today, config),
        studyMinutes: moduleLogs.reduce((a, l) => a + l.minutes, 0),
        studyMinutesWeek: moduleLogs.filter((l) => l.date >= monday && l.date <= sunday).reduce((a, l) => a + l.minutes, 0),
      }
    })
    return { semester, config, modules: views, overall: overallProgress(views.map((v) => v.progress)) }
  }, [semester, modules, units, settings, logs, today])
}
