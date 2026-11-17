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
  /** Nur an diesen ISO-Wochentagen (1 = Mo … 7 = So). Fehlt/null = täglich. */
  weekdays?: number[] | null
  /** Zu welchem Skill-Baum die Gewohnheit zählt. Fehlt = automatisch nach Name. */
  skill?: HabitSkill | null
}

export type HabitSkill = 'health' | 'hygiene' | 'none'

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

/** id = `reading_${date}` (ohne Buch, ältere Einträge) bzw. `reading_${date}_${bookId}` */
export interface ReadingLog extends BaseRecord {
  date: DateStr
  minutes: number
  bookId?: string | null
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
  /** Freie Notizen, z. B. Klausurformat und erlaubte Hilfsmittel (optional, ältere Datensätze haben es nicht) */
  note?: string | null
  /** Leistungspunkte (Standard 5) */
  ects?: number | null
  /** Endnote, sobald bekannt (1,0–5,0) */
  grade?: number | null
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
  /** Zeitpunkt des letzten Exports (ms), für die Backup-Erinnerung */
  lastBackupAt?: number | null
  /** Zuletzt gesehene Level – für Level-Up-Hinweise */
  levelSnapshot?: { character: number; skills: Record<string, number> } | null
  /** Errungenschaft-ID → Tag, an dem sie zuerst erreicht wurde */
  achievementDates?: Record<string, DateStr>
}

/* ---------- Charakter ---------- */

export type Sex = 'm' | 'f'

/** Persönliches Profil, id ist immer 'me' */
export interface Profile extends BaseRecord {
  birthDate: DateStr | null
  heightCm: number | null
  sex: Sex | null
  instrument: string
  /** Index auf der Meilenstein-Leiter des Instruments */
  musicMilestone: number
}

/** id = `body_${date}` */
export interface BodyLog extends BaseRecord {
  date: DateStr
  weightKg: number | null
  bodyFatPct: number | null
}

/** Kraftübungen; standard verknüpft mit einer Kraft-Standardtabelle (sonst nur Verlauf) */
export type LiftStandard = 'bench' | 'squat' | 'deadlift' | 'ohp' | 'row' | 'pullup'

export interface Exercise extends BaseRecord {
  name: string
  standard: LiftStandard | null
  order: number
  archived: boolean
}

/** Ein Satz/Bestwert: Gewicht × Wiederholungen (bei Klimmzügen: Zusatzgewicht) */
export interface LiftLog extends BaseRecord {
  exerciseId: string
  date: DateStr
  weightKg: number
  reps: number
  /** Quelle, z. B. für den späteren Strong-Import */
  source: TrainingSource
}

export interface RunLog extends BaseRecord {
  date: DateStr
  distanceKm: number
  seconds: number
}

export type BookDifficulty = 'easy' | 'medium' | 'hard'
export type BookStatus = 'reading' | 'done' | 'paused'

export interface Book extends BaseRecord {
  title: string
  difficulty: BookDifficulty
  status: BookStatus
  startDate: DateStr | null
  endDate: DateStr | null
}

/** id = `music_${date}` – Übungszeit am Instrument */
export interface MusicLog extends BaseRecord {
  date: DateStr
  minutes: number
}

export type MilestoneSize = 'small' | 'medium' | 'large'

export interface ProjectMilestone extends BaseRecord {
  projectId: string
  title: string
  size: MilestoneSize
  doneDate: DateStr | null
  order: number
}

/** Abgeschlossene Module aus früheren Semestern */
export interface PastGrade extends BaseRecord {
  name: string
  ects: number
  grade: number
  semester: string | null
}
