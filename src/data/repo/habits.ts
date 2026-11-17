import { todayStr, type DateStr } from '../../lib/dates'
import { alive, byOrder, changed, created } from '../base'
import { db } from '../db'
import type { Habit, HabitLog } from '../types'

export const habitLogId = (habitId: string, date: DateStr) => `${habitId}_${date}`

/** Alle (nicht gelöschten) Gewohnheiten inkl. archivierter, sortiert. */
export async function listHabits(): Promise<Habit[]> {
  return (await db.habits.toArray()).filter(alive).sort(byOrder)
}

export async function createHabit(name: string, activeFrom: DateStr = todayStr()): Promise<string> {
  const habits = await listHabits()
  const order = habits.reduce((max, h) => Math.max(max, h.order), -1) + 1
  const habit = created({ name: name.trim(), order, activeFrom, archivedFrom: null })
  await db.habits.add(habit)
  return habit.id
}

export async function updateHabit(
  id: string,
  patch: Partial<Pick<Habit, 'name' | 'activeFrom'>>,
): Promise<void> {
  const clean = { ...patch }
  if (clean.name !== undefined) clean.name = clean.name.trim()
  await db.habits.update(id, changed(clean))
}

/** Archivieren: zählt ab `from` nicht mehr; Vergangenheit bleibt unverändert. */
export async function archiveHabit(id: string, from: DateStr = todayStr()): Promise<void> {
  await db.habits.update(id, changed({ archivedFrom: from }))
}

export async function restoreHabit(id: string): Promise<void> {
  const habits = await listHabits()
  const order = habits.reduce((max, h) => Math.max(max, h.order), -1) + 1
  await db.habits.update(id, changed({ archivedFrom: null, order }))
}

/** Endgültig entfernen (inkl. aller Haken). Soft-Delete für späteren Sync. */
export async function deleteHabit(id: string): Promise<void> {
  const now = Date.now()
  await db.transaction('rw', db.habits, db.habitLogs, async () => {
    await db.habits.update(id, { deletedAt: now, updatedAt: now })
    await db.habitLogs.where('habitId').equals(id).modify({ deletedAt: now, updatedAt: now })
  })
}

/** Verschiebt eine Gewohnheit unter den aktiven um eine Position nach oben (-1) oder unten (+1). */
export async function moveHabit(id: string, direction: -1 | 1): Promise<void> {
  await db.transaction('rw', db.habits, async () => {
    const active = (await listHabits()).filter((h) => h.archivedFrom == null)
    const index = active.findIndex((h) => h.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= active.length) return
    const reordered = [...active]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    const now = Date.now()
    await Promise.all(reordered.map((h, i) => db.habits.update(h.id, { order: i, updatedAt: now })))
  })
}

export async function listHabitLogs(): Promise<HabitLog[]> {
  return (await db.habitLogs.toArray()).filter(alive)
}

export async function setHabitDone(habitId: string, date: DateStr, done: boolean): Promise<void> {
  const id = habitLogId(habitId, date)
  await db.transaction('rw', db.habitLogs, async () => {
    const existing = await db.habitLogs.get(id)
    if (existing) {
      await db.habitLogs.update(id, changed({ done, deletedAt: null }))
    } else {
      await db.habitLogs.add(created({ habitId, date, done }, id))
    }
  })
}
