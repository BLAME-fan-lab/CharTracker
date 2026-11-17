import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import * as habits from './repo/habits'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('Startdaten', () => {
  it('legt Gewohnheiten, Module, Semester und Einstellungen an', async () => {
    expect((await habits.listHabits()).map((h) => h.name)).toEqual([
      'Pünktlich aufgestanden',
      'Zähne geputzt morgens',
      'Zähne geputzt abends',
      'Geduscht',
      'Schlaf im Zielbereich (6:30–8 h)',
    ])
    expect(await db.modules.count()).toBe(7)
    expect(await db.trainingTypes.count()).toBe(2)
    expect(await db.todoCategories.count()).toBe(4)
    const semester = await db.semesters.toCollection().first()
    expect(semester?.targetDate).toBe('2027-02-15')
    expect((await db.settings.get('app'))?.studyBufferDays).toBe(7)
  })
})

describe('habitsRepo', () => {
  it('hakt ab und wieder ab (deterministische ID)', async () => {
    const [first] = await habits.listHabits()
    await habits.setHabitDone(first.id, '2026-11-17', true)
    await habits.setHabitDone(first.id, '2026-11-17', false)
    await habits.setHabitDone(first.id, '2026-11-17', true)
    const logs = await habits.listHabitLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({ id: `${first.id}_2026-11-17`, done: true })
  })

  it('anlegen, umbenennen, verschieben, archivieren, löschen', async () => {
    const id = await habits.createHabit('  Lesen vor dem Schlafen ', '2026-11-17')
    let list = await habits.listHabits()
    expect(list.at(-1)).toMatchObject({ id, name: 'Lesen vor dem Schlafen', activeFrom: '2026-11-17' })

    await habits.updateHabit(id, { name: 'Lesen' })
    await habits.moveHabit(id, -1)
    list = await habits.listHabits()
    expect(list.map((h) => h.name).slice(-2)).toEqual(['Lesen', 'Schlaf im Zielbereich (6:30–8 h)'])

    await habits.archiveHabit(id, '2026-11-20')
    expect((await habits.listHabits()).find((h) => h.id === id)?.archivedFrom).toBe('2026-11-20')

    await habits.setHabitDone(id, '2026-11-18', true)
    await habits.deleteHabit(id)
    expect((await habits.listHabits()).find((h) => h.id === id)).toBeUndefined()
    expect(await habits.listHabitLogs()).toHaveLength(0)
  })
})
