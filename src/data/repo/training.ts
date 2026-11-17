import type { DateStr } from '../../lib/dates'
import { alive, byOrder, changed, created } from '../base'
import { db } from '../db'
import type { TrainingPlan, TrainingSession, TrainingSource, TrainingType } from '../types'

/* ---------- Typen ---------- */

export async function listTrainingTypes(): Promise<TrainingType[]> {
  return (await db.trainingTypes.toArray()).filter(alive).sort(byOrder)
}

export async function createTrainingType(name: string): Promise<string> {
  const types = await listTrainingTypes()
  const order = types.reduce((max, t) => Math.max(max, t.order), -1) + 1
  const type = created({ name: name.trim(), order, archived: false })
  await db.trainingTypes.add(type)
  return type.id
}

export async function renameTrainingType(id: string, name: string): Promise<void> {
  await db.trainingTypes.update(id, changed({ name: name.trim() }))
}

export async function setTrainingTypeArchived(id: string, archived: boolean): Promise<void> {
  await db.trainingTypes.update(id, changed({ archived }))
}

/* ---------- Pläne (gültig ab Woche) ---------- */

export async function listTrainingPlans(): Promise<TrainingPlan[]> {
  return (await db.trainingPlans.toArray()).filter(alive).sort((a, b) => a.validFrom.localeCompare(b.validFrom))
}

/**
 * Speichert den Plan ab der Woche `validFrom` (Montag).
 * Spätere Pläne werden ersetzt – „ab dieser Woche gilt das“.
 */
export async function saveTrainingPlan(
  validFrom: DateStr,
  targets: { typeId: string; count: number }[],
): Promise<void> {
  const clean = targets.filter((t) => t.count > 0).map((t) => ({ typeId: t.typeId, count: Math.round(t.count) }))
  await db.transaction('rw', db.trainingPlans, async () => {
    const plans = await listTrainingPlans()
    const now = Date.now()
    for (const p of plans) {
      if (p.validFrom > validFrom) await db.trainingPlans.update(p.id, { deletedAt: now, updatedAt: now })
    }
    const same = plans.find((p) => p.validFrom === validFrom)
    if (same) await db.trainingPlans.update(same.id, changed({ targets: clean }))
    else await db.trainingPlans.add(created({ validFrom, targets: clean }))
  })
}

export async function deleteTrainingPlan(id: string): Promise<void> {
  const now = Date.now()
  await db.trainingPlans.update(id, { deletedAt: now, updatedAt: now })
}

/* ---------- Einheiten ---------- */

export async function listTrainingSessions(from: DateStr, to: DateStr): Promise<TrainingSession[]> {
  const rows = await db.trainingSessions.where('date').between(from, to, true, true).toArray()
  return rows.filter(alive).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
}

export async function addTrainingSession(
  date: DateStr,
  typeId: string,
  source: TrainingSource = 'manual',
  externalId: string | null = null,
): Promise<string> {
  const session = created({ date, typeId, source, externalId, note: null })
  await db.trainingSessions.add(session)
  return session.id
}

export async function deleteTrainingSession(id: string): Promise<void> {
  const now = Date.now()
  await db.trainingSessions.update(id, { deletedAt: now, updatedAt: now })
}
