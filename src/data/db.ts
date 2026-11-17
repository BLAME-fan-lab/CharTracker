import Dexie, { type EntityTable } from 'dexie'
import { seedDatabase } from './seed'
import type {
  AppSettings,
  GoalTarget,
  Habit,
  HabitLog,
  Module,
  Project,
  ProjectLog,
  ProjectNote,
  ReadingLog,
  Semester,
  StudyLog,
  StudyUnit,
  Todo,
  TodoCategory,
  TrainingPlan,
  TrainingSession,
  TrainingType,
} from './types'

/**
 * Lokaler Speicher (IndexedDB über Dexie).
 * Nur Dateien in src/data/ dürfen dieses Modul importieren – die Oberfläche nutzt die Repositories/Hooks.
 * Ein späterer Supabase-Sync setzt hier an: Dexie bleibt der Offline-Speicher, Änderungen
 * werden per updatedAt/deletedAt abgeglichen.
 */
export class TrackerDB extends Dexie {
  habits!: EntityTable<Habit, 'id'>
  habitLogs!: EntityTable<HabitLog, 'id'>
  trainingTypes!: EntityTable<TrainingType, 'id'>
  trainingPlans!: EntityTable<TrainingPlan, 'id'>
  trainingSessions!: EntityTable<TrainingSession, 'id'>
  goalTargets!: EntityTable<GoalTarget, 'id'>
  readingLogs!: EntityTable<ReadingLog, 'id'>
  studyLogs!: EntityTable<StudyLog, 'id'>
  projects!: EntityTable<Project, 'id'>
  projectLogs!: EntityTable<ProjectLog, 'id'>
  projectNotes!: EntityTable<ProjectNote, 'id'>
  todoCategories!: EntityTable<TodoCategory, 'id'>
  todos!: EntityTable<Todo, 'id'>
  semesters!: EntityTable<Semester, 'id'>
  modules!: EntityTable<Module, 'id'>
  studyUnits!: EntityTable<StudyUnit, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor(name = 'tracker') {
    super(name)
    this.version(1).stores({
      habits: 'id, updatedAt',
      habitLogs: 'id, date, habitId, updatedAt',
      trainingTypes: 'id, updatedAt',
      trainingPlans: 'id, validFrom, updatedAt',
      trainingSessions: 'id, date, typeId, externalId, updatedAt',
      goalTargets: 'id, kind, validFrom, updatedAt',
      readingLogs: 'id, date, updatedAt',
      studyLogs: 'id, date, moduleId, updatedAt',
      projects: 'id, updatedAt',
      projectLogs: 'id, date, projectId, updatedAt',
      projectNotes: 'id, weekStart, projectId, updatedAt',
      todoCategories: 'id, updatedAt',
      todos: 'id, dueDate, updatedAt',
      semesters: 'id, updatedAt',
      modules: 'id, semesterId, updatedAt',
      studyUnits: 'id, moduleId, dueDate, updatedAt',
      settings: 'id, updatedAt',
    })
    this.on('populate', () => seedDatabase(this))
  }
}

export const db = new TrackerDB()

/** Namen aller Tabellen – z. B. für Export/Import und Sync. */
export const TABLE_NAMES = [
  'habits',
  'habitLogs',
  'trainingTypes',
  'trainingPlans',
  'trainingSessions',
  'goalTargets',
  'readingLogs',
  'studyLogs',
  'projects',
  'projectLogs',
  'projectNotes',
  'todoCategories',
  'todos',
  'semesters',
  'modules',
  'studyUnits',
  'settings',
] as const

export type TableName = (typeof TABLE_NAMES)[number]
