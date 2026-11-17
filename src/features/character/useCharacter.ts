import { useMemo } from 'react'
import {
  useActiveModules,
  useAllProjectLogs,
  useAllReadingLogs,
  useAllTrainingSessions,
  useBodyLogs,
  useBooks,
  useExercises,
  useGoalTargets,
  useHabitLogs,
  useHabits,
  useLiftLogs,
  useMusicLogs,
  usePastGrades,
  useProfile,
  useProjectMilestones,
  useRunLogs,
  useSettings,
  useTrainingPlans,
} from '../../data'
import { computeCharacter, type CharacterSheet } from '../../domain/characterSheet'
import type { DateStr } from '../../lib/dates'

/** Lädt alle Daten und berechnet den Charakterbogen. `undefined` während des Ladens. */
export function useCharacter(today: DateStr): CharacterSheet | undefined {
  const settings = useSettings()
  const habits = useHabits()
  const habitLogs = useHabitLogs()
  const trainingPlans = useTrainingPlans()
  const trainingSessions = useAllTrainingSessions()
  const goalTargets = useGoalTargets()
  const readingLogs = useAllReadingLogs()
  const books = useBooks()
  const modules = useActiveModules()
  const pastGrades = usePastGrades()
  const profile = useProfile()
  const bodyLogs = useBodyLogs()
  const exercises = useExercises()
  const liftLogs = useLiftLogs()
  const runLogs = useRunLogs()
  const musicLogs = useMusicLogs()
  const projectLogs = useAllProjectLogs()
  const projectMilestones = useProjectMilestones()

  return useMemo(() => {
    if (
      !settings || !habits || !habitLogs || !trainingPlans || !trainingSessions || !goalTargets || !readingLogs ||
      !books || !modules || !pastGrades || !bodyLogs || !exercises || !liftLogs || !runLogs || !musicLogs ||
      !projectLogs || !projectMilestones
    ) {
      return undefined
    }
    return computeCharacter({
      today,
      trackingStart: settings.trackingStart,
      habits,
      habitLogs,
      trainingPlans,
      trainingSessions,
      goalTargets,
      readingLogs,
      books,
      modules,
      pastGrades,
      profile,
      bodyLogs,
      exercises,
      liftLogs,
      runLogs,
      musicLogs,
      projectLogs,
      projectMilestones,
    })
  }, [
    today, settings, habits, habitLogs, trainingPlans, trainingSessions, goalTargets, readingLogs, books, modules,
    pastGrades, profile, bodyLogs, exercises, liftLogs, runLogs, musicLogs, projectLogs, projectMilestones,
  ])
}
