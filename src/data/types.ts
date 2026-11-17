import type { DateStr } from '../lib/dates'

/**
 * Gemeinsame Felder aller Datensätze – vorbereitet für einen späteren Sync (Supabase):
 * - id: UUID oder deterministischer Schlüssel (bei Tages-Einträgen), damit zwei Geräte nicht kollidieren
 * - updatedAt: „last write wins“ beim Sync
 * - deletedAt: Soft-Delete, damit Löschungen auf andere Geräte übertragen werden können
 */
export interface BaseRecord {
  id: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

/* ---------- Tägliche Ziele ---------- */

export interface Habit extends BaseRecord {
  name: string
  order: number
  /** Ab diesem Tag zählt die Gewohnheit (Heatmap, Streak). */
  activeFrom: DateStr
  /** Ab diesem Tag nicht mehr aktiv (archiviert). null = aktiv. */
  archivedFrom: DateStr | null
}

/** id = `${habitId}_${date}` */
export interface HabitLog extends BaseRecord {
  habitId: string
  date: DateStr
  done: boolean
}

/* ---------- Wochenziele ---------- */

export interface TrainingType extends BaseRecord {
  name: string
  order: number
  archived: boolean
}

/** Trainingsplan, gültig ab einer Woche (Montag) bis zum nächsten Plan. */
export interface TrainingPlan extends BaseRecord {
  validFrom: DateStr
  targets: { typeId: string; count: number }[]
}

export type TrainingSource = 'manual' | 'strong'

export interface TrainingSession extends BaseRecord {
  date: DateStr
  typeId: string
  source: TrainingSource
  /** z. B. Workout-ID/Zeitstempel aus dem Strong-CSV, um Doppel-Importe zu erkennen */
  externalId: string | null
  note: string | null
}

export type GoalKind = 'reading' | 'study'

/** Soll-Wert eines Wochenziels in Minuten, gültig ab einer Woche (Montag). */
export interface GoalTarget extends BaseRecord {
  kind: GoalKind
  validFrom: DateStr
  minutes: number
}

/** id = `reading_${date}` */
export interface ReadingLog extends BaseRecord {
  date: DateStr
  minutes: number
}

/** id = `study_${date}_${moduleId ?? 'general'}` */
export interface StudyLog extends BaseRecord {
  date: DateStr
  /** null = „Allgemein (ohne Modul)“ */
  moduleId: string | null
  minutes: number
}

/* ---------- Projekt (vorerst schlicht) ---------- */

export interface Project extends BaseRecord {
  name: string
  order: number
  active: boolean
}

/** id = `${projectId}_${date}` */
export interface ProjectLog extends BaseRecord {
  projectId: string
  date: DateStr
  minutes: number
}

/** id = `${projectId}_${weekStart}` */
export interface ProjectNote extends BaseRecord {
  projectId: string
  weekStart: DateStr
  text: string
}

/* ---------- To-dos ---------- */

export type Priority = 'high' | 'medium' | 'low'

export interface TodoCategory extends BaseRecord {
  name: string
  color: string
  order: number
  archived: boolean
}

export interface Todo extends BaseRecord {
  title: string
  dueDate: DateStr | null
  priority: Priority
  categoryId: string | null
  note: string | null
  /** Erledigt am (null = offen) */
  doneDate: DateStr | null
}

/* ---------- Uni ---------- */

export interface SemesterPeriod {
  name: string
  start: DateStr
  end: DateStr
}

export interface Semester extends BaseRecord {
  name: string
  start: DateStr
  end: DateStr
  lectureStart: DateStr
  lectureEnd: DateStr
  lectureFreeStart: DateStr
  lectureFreeEnd: DateStr
  breaks: SemesterPeriod[]
  /** Bis hierhin soll alles gelernt sein (Soll = 100 %), sofern Klausur − Puffer nicht früher liegt. */
  targetDate: DateStr
  active: boolean
}

export interface Module extends BaseRecord {
  semesterId: string
  name: string
  shortName: string
  examDate: DateStr | null
  /** 'HH:mm', optional */
  examTime: string | null
  order: number
  archived: boolean
}

export type StudyUnitType = 'script' | 'sheet' | 'mock_exam' | 'other'

export interface StudyUnit extends BaseRecord {
  moduleId: string
  title: string
  type: StudyUnitType
  dueDate: DateStr | null
  doneDate: DateStr | null
  order: number
}

/* ---------- Einstellungen ---------- */

export interface AppSettings extends BaseRecord {
  /** id ist immer 'app' */
  studyBufferDays: number
  /** ± Prozentpunkte, in denen ein Modul als „im Plan“ gilt */
  statusTolerancePp: number
  /** Soll-Verlauf in Semesterpausen anhalten */
  pauseSollInBreaks: boolean
  /** Erster Tag, an dem die App benutzt wurde */
  trackingStart: DateStr
}
