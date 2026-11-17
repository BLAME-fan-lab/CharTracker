import type { DateStr } from '../../lib/dates'
import { alive, byOrder, changed, created } from '../base'
import { db } from '../db'
import type {
  BaseRecord,
  Book,
  BookDifficulty,
  BodyLog,
  Exercise,
  LiftLog,
  LiftStandard,
  MilestoneSize,
  MusicLog,
  PastGrade,
  Profile,
  ProjectMilestone,
  RunLog,
} from '../types'

const softDelete = async (table: { update: (id: string, c: object) => Promise<unknown> }, id: string) => {
  const now = Date.now()
  await table.update(id, { deletedAt: now, updatedAt: now })
}

/* ---------- Profil ---------- */

export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.get('me')
}

export async function updateProfile(patch: Partial<Omit<Profile, keyof BaseRecord>>): Promise<void> {
  await db.profile.update('me', changed(patch))
}

/* ---------- Körperwerte ---------- */

export const bodyLogId = (date: DateStr) => `body_${date}`

export async function listBodyLogs(): Promise<BodyLog[]> {
  return (await db.bodyLogs.toArray()).filter(alive).sort((a, b) => a.date.localeCompare(b.date))
}

/** Gewicht/Körperfett für einen Tag setzen (null = Wert entfernen). Leere Einträge werden gelöscht. */
export async function setBodyLog(date: DateStr, patch: { weightKg?: number | null; bodyFatPct?: number | null }): Promise<void> {
  const id = bodyLogId(date)
  await db.transaction('rw', db.bodyLogs, async () => {
    const existing = await db.bodyLogs.get(id)
    const next = {
      weightKg: patch.weightKg !== undefined ? patch.weightKg : (existing?.weightKg ?? null),
      bodyFatPct: patch.bodyFatPct !== undefined ? patch.bodyFatPct : (existing?.bodyFatPct ?? null),
    }
    const empty = next.weightKg == null && next.bodyFatPct == null
    if (existing) await db.bodyLogs.update(id, changed({ ...next, deletedAt: empty ? Date.now() : null }))
    else if (!empty) await db.bodyLogs.add(created({ date, ...next }, id))
  })
}

/* ---------- Übungen & Kraftwerte ---------- */

export async function listExercises(): Promise<Exercise[]> {
  return (await db.exercises.toArray()).filter(alive).sort(byOrder)
}

export async function createExercise(name: string, standard: LiftStandard | null): Promise<string> {
  const list = await listExercises()
  const order = list.reduce((m, e) => Math.max(m, e.order), -1) + 1
  const ex = created({ name: name.trim(), standard, order, archived: false })
  await db.exercises.add(ex)
  return ex.id
}

export async function updateExercise(id: string, patch: Partial<Pick<Exercise, 'name' | 'standard' | 'archived'>>): Promise<void> {
  await db.exercises.update(id, changed(patch.name !== undefined ? { ...patch, name: patch.name.trim() } : patch))
}

export async function listLiftLogs(): Promise<LiftLog[]> {
  return (await db.liftLogs.toArray()).filter(alive).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
}

export async function addLiftLog(exerciseId: string, date: DateStr, weightKg: number, reps: number): Promise<string> {
  const log = created({ exerciseId, date, weightKg, reps, source: 'manual' as const })
  await db.liftLogs.add(log)
  return log.id
}

export const deleteLiftLog = (id: string) => softDelete(db.liftLogs, id)

/* ---------- Läufe ---------- */

export async function listRunLogs(): Promise<RunLog[]> {
  return (await db.runLogs.toArray()).filter(alive).sort((a, b) => a.date.localeCompare(b.date))
}

export async function addRunLog(date: DateStr, distanceKm: number, seconds: number): Promise<string> {
  const log = created({ date, distanceKm, seconds })
  await db.runLogs.add(log)
  return log.id
}

export const deleteRunLog = (id: string) => softDelete(db.runLogs, id)

/* ---------- Bücher ---------- */

export async function listBooks(): Promise<Book[]> {
  return (await db.books.toArray()).filter(alive).sort((a, b) => a.createdAt - b.createdAt)
}

export async function createBook(title: string, difficulty: BookDifficulty, startDate: DateStr | null): Promise<string> {
  const book = created({ title: title.trim(), difficulty, status: 'reading' as const, startDate, endDate: null })
  await db.books.add(book)
  return book.id
}

export async function updateBook(id: string, patch: Partial<Omit<Book, keyof BaseRecord>>): Promise<void> {
  await db.books.update(id, changed(patch.title !== undefined ? { ...patch, title: patch.title.trim() } : patch))
}

export const deleteBook = (id: string) => softDelete(db.books, id)

/* ---------- Musik ---------- */

export const musicLogId = (date: DateStr) => `music_${date}`

export async function listMusicLogs(): Promise<MusicLog[]> {
  return (await db.musicLogs.toArray()).filter(alive)
}

export async function setMusicMinutes(date: DateStr, minutes: number): Promise<void> {
  const id = musicLogId(date)
  const value = Math.max(0, Math.round(minutes))
  await db.transaction('rw', db.musicLogs, async () => {
    const existing = await db.musicLogs.get(id)
    if (existing) await db.musicLogs.update(id, changed({ minutes: value, deletedAt: null }))
    else await db.musicLogs.add(created({ date, minutes: value }, id))
  })
}

/* ---------- Projekt-Meilensteine ---------- */

export async function listProjectMilestones(): Promise<ProjectMilestone[]> {
  return (await db.projectMilestones.toArray()).filter(alive).sort(byOrder)
}

export async function createProjectMilestone(projectId: string, title: string, size: MilestoneSize): Promise<string> {
  const list = await listProjectMilestones()
  const order = list.reduce((m, x) => Math.max(m, x.order), -1) + 1
  const ms = created({ projectId, title: title.trim(), size, doneDate: null, order })
  await db.projectMilestones.add(ms)
  return ms.id
}

export async function updateProjectMilestone(
  id: string,
  patch: Partial<Pick<ProjectMilestone, 'title' | 'size' | 'doneDate'>>,
): Promise<void> {
  await db.projectMilestones.update(id, changed(patch))
}

export const deleteProjectMilestone = (id: string) => softDelete(db.projectMilestones, id)

/* ---------- Frühere Noten ---------- */

export async function listPastGrades(): Promise<PastGrade[]> {
  return (await db.pastGrades.toArray()).filter(alive).sort((a, b) => a.createdAt - b.createdAt)
}

export async function createPastGrade(name: string, ects: number, grade: number, semester: string | null): Promise<string> {
  const g = created({ name: name.trim(), ects, grade, semester })
  await db.pastGrades.add(g)
  return g.id
}

export async function updatePastGrade(id: string, patch: Partial<Omit<PastGrade, keyof BaseRecord>>): Promise<void> {
  await db.pastGrades.update(id, changed(patch))
}

export const deletePastGrade = (id: string) => softDelete(db.pastGrades, id)
