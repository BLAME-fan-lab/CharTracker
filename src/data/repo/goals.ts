import type { DateStr } from '../../lib/dates'
import { alive, changed, created } from '../base'
import { db } from '../db'
import type { GoalKind, GoalTarget, ReadingLog, StudyLog } from '../types'

/* ---------- Sollwerte (gültig ab Woche) ---------- */

export async function listGoalTargets(): Promise<GoalTarget[]> {
  return (await db.goalTargets.toArray()).filter(alive).sort((a, b) => a.validFrom.localeCompare(b.validFrom))
}

/** Setzt den Sollwert ab der Woche `validFrom`; spätere Einträge dieser Art werden ersetzt. */
export async function saveGoalTarget(kind: GoalKind, validFrom: DateStr, minutes: number): Promise<void> {
  await db.transaction('rw', db.goalTargets, async () => {
    const targets = (await listGoalTargets()).filter((t) => t.kind === kind)
    const now = Date.now()
    for (const t of targets) {
      if (t.validFrom > validFrom) await db.goalTargets.update(t.id, { deletedAt: now, updatedAt: now })
    }
    const same = targets.find((t) => t.validFrom === validFrom)
    if (same) await db.goalTargets.update(same.id, changed({ minutes: Math.round(minutes) }))
    else await db.goalTargets.add(created({ kind, validFrom, minutes: Math.round(minutes) }))
  })
}

/* ---------- Lesen ---------- */

export const readingLogId = (date: DateStr) => `reading_${date}`

export async function listReadingLogs(from: DateStr, to: DateStr): Promise<ReadingLog[]> {
  return (await db.readingLogs.where('date').between(from, to, true, true).toArray()).filter(alive)
}

export async function setReadingMinutes(date: DateStr, minutes: number): Promise<void> {
  const id = readingLogId(date)
  const value = Math.max(0, Math.round(minutes))
  await db.transaction('rw', db.readingLogs, async () => {
    const existing = await db.readingLogs.get(id)
    if (existing) await db.readingLogs.update(id, changed({ minutes: value, deletedAt: null }))
    else await db.readingLogs.add(created({ date, minutes: value }, id))
  })
}

/* ---------- Lernen ---------- */

export const studyLogId = (date: DateStr, moduleId: string | null) => `study_${date}_${moduleId ?? 'general'}`

export async function listStudyLogs(from: DateStr, to: DateStr): Promise<StudyLog[]> {
  return (await db.studyLogs.where('date').between(from, to, true, true).toArray()).filter(alive)
}

export async function listAllStudyLogs(): Promise<StudyLog[]> {
  return (await db.studyLogs.toArray()).filter(alive)
}

export async function setStudyMinutes(date: DateStr, moduleId: string | null, minutes: number): Promise<void> {
  const id = studyLogId(date, moduleId)
  const value = Math.max(0, Math.round(minutes))
  await db.transaction('rw', db.studyLogs, async () => {
    const existing = await db.studyLogs.get(id)
    if (existing) await db.studyLogs.update(id, changed({ minutes: value, deletedAt: null }))
    else await db.studyLogs.add(created({ date, moduleId, minutes: value }, id))
  })
}
