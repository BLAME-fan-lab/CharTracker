import { useLiveQuery } from 'dexie-react-hooks'
import type { DateStr } from '../lib/dates'
import { listAllReadingLogs, listAllStudyLogs, listGoalTargets, listReadingLogs, listStudyLogs } from './repo/goals'
import { listHabitLogs, listHabits } from './repo/habits'
import { getProjectNote, listAllProjectLogs, listProjectLogs, listProjects } from './repo/projects'
import { getSettings } from './repo/settings'
import { listAllTrainingSessions, listTrainingPlans, listTrainingSessions, listTrainingTypes } from './repo/training'
import {
  getProfile,
  listBodyLogs,
  listBooks,
  listExercises,
  listLiftLogs,
  listMusicLogs,
  listPastGrades,
  listProjectMilestones,
  listRunLogs,
} from './repo/character'
import { listTodoCategories, listTodos } from './repo/todos'
import { getActiveSemester, listActiveModules, listAllModules, listStudyUnits } from './repo/uni'

/*
 * Reaktive Lese-Hooks. Sie liefern `undefined`, solange die Daten laden,
 * und aktualisieren sich automatisch bei jeder Änderung in der Datenbank.
 */

export const useHabits = () => useLiveQuery(listHabits, [])
export const useHabitLogs = () => useLiveQuery(listHabitLogs, [])
export const useSettings = () => useLiveQuery(getSettings, [])

export const useTrainingTypes = () => useLiveQuery(listTrainingTypes, [])
export const useTrainingPlans = () => useLiveQuery(listTrainingPlans, [])
export const useTrainingSessions = (from: DateStr, to: DateStr) =>
  useLiveQuery(() => listTrainingSessions(from, to), [from, to])

export const useGoalTargets = () => useLiveQuery(listGoalTargets, [])
export const useReadingLogs = (from: DateStr, to: DateStr) => useLiveQuery(() => listReadingLogs(from, to), [from, to])
export const useStudyLogs = (from: DateStr, to: DateStr) => useLiveQuery(() => listStudyLogs(from, to), [from, to])

export const useProjects = () => useLiveQuery(listProjects, [])
export const useProjectLogs = (from: DateStr, to: DateStr) => useLiveQuery(() => listProjectLogs(from, to), [from, to])
/** `null` = keine Notiz, `undefined` = lädt */
export const useProjectNote = (projectId: string | undefined, weekStart: DateStr) =>
  useLiveQuery(
    async () => (projectId ? ((await getProjectNote(projectId, weekStart)) ?? null) : null),
    [projectId, weekStart],
  )

/** `undefined` = lädt, `null` = kein Semester angelegt */
export const useActiveSemester = () => useLiveQuery(async () => (await getActiveSemester()) ?? null, [])
export const useActiveModules = () => useLiveQuery(listActiveModules, [])
export const useAllModules = () => useLiveQuery(listAllModules, [])
export const useStudyUnits = () => useLiveQuery(listStudyUnits, [])

export const useTodos = () => useLiveQuery(listTodos, [])
export const useTodoCategories = () => useLiveQuery(listTodoCategories, [])

export const useAllReadingLogs = () => useLiveQuery(listAllReadingLogs, [])
export const useAllProjectLogs = () => useLiveQuery(listAllProjectLogs, [])
export const useAllTrainingSessions = () => useLiveQuery(listAllTrainingSessions, [])

export const useProfile = () => useLiveQuery(getProfile, [])
export const useBodyLogs = () => useLiveQuery(listBodyLogs, [])
export const useExercises = () => useLiveQuery(listExercises, [])
export const useLiftLogs = () => useLiveQuery(listLiftLogs, [])
export const useRunLogs = () => useLiveQuery(listRunLogs, [])
export const useBooks = () => useLiveQuery(listBooks, [])
export const useMusicLogs = () => useLiveQuery(listMusicLogs, [])
export const useProjectMilestones = () => useLiveQuery(listProjectMilestones, [])
export const usePastGrades = () => useLiveQuery(listPastGrades, [])
export const useAllStudyLogs = () => useLiveQuery(listAllStudyLogs, [])
