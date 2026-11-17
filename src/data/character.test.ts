import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, TrackerDB } from './db'
import * as character from './repo/character'
import * as goals from './repo/goals'
import * as habits from './repo/habits'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('Upgrade auf Version 2', () => {
  it('bestehende Daten bleiben, Profil und Übungen kommen dazu', async () => {
    const name = 'upgrade-test'
    await Dexie.delete(name)
    const v1 = new Dexie(name)
    v1.version(1).stores({ habits: 'id, updatedAt', habitLogs: 'id, date, habitId, updatedAt', settings: 'id, updatedAt' })
    await v1.open()
    await v1.table('habits').add({ id: 'h1', name: 'Alt', order: 0, activeFrom: '2026-11-16', archivedFrom: null, createdAt: 1, updatedAt: 1, deletedAt: null })
    v1.close()

    const v2 = new TrackerDB(name)
    await v2.open()
    expect(await v2.habits.get('h1')).toMatchObject({ name: 'Alt' })
    expect(await v2.profile.get('me')).toMatchObject({ instrument: 'Klavier', musicMilestone: 0 })
    expect((await v2.exercises.toArray()).sort((a, b) => a.order - b.order).map((e) => e.name)).toEqual(['Bankdrücken', 'Kniebeuge', 'Kreuzheben', 'Schulterdrücken', 'Klimmzüge'])
    v2.close()
    await Dexie.delete(name)
  })

  it('neue Datenbank hat Profil und Übungen', async () => {
    expect(await character.getProfile()).toBeDefined()
    expect(await character.listExercises()).toHaveLength(5)
  })
})

describe('characterRepo', () => {
  it('Profil und Körperwerte', async () => {
    await character.updateProfile({ heightCm: 180, sex: 'm', birthDate: '2005-03-01' })
    expect((await character.getProfile())?.heightCm).toBe(180)
    await character.setBodyLog('2026-11-17', { weightKg: 78.5 })
    await character.setBodyLog('2026-11-17', { bodyFatPct: 15 })
    expect(await character.listBodyLogs()).toMatchObject([{ weightKg: 78.5, bodyFatPct: 15 }])
    await character.setBodyLog('2026-11-17', { weightKg: null, bodyFatPct: null })
    expect(await character.listBodyLogs()).toHaveLength(0)
  })

  it('Übungen, Kraftwerte, Läufe', async () => {
    const id = await character.createExercise('Rudern', 'row')
    const log = await character.addLiftLog(id, '2026-11-17', 60, 8)
    await character.addRunLog('2026-11-17', 5, 1650)
    expect((await character.listLiftLogs()).map((l) => [l.weightKg, l.reps])).toEqual([[60, 8]])
    await character.deleteLiftLog(log)
    expect(await character.listLiftLogs()).toHaveLength(0)
    expect(await character.listRunLogs()).toHaveLength(1)
  })

  it('Bücher und Lesen pro Buch', async () => {
    const book = await character.createBook('Kritik der reinen Vernunft', 'hard', '2026-11-17')
    await goals.setReadingMinutes('2026-11-17', 30, book)
    await goals.setReadingMinutes('2026-11-17', 15)
    await goals.setReadingMinutes('2026-11-17', 45, book)
    const logs = await goals.listReadingLogs('2026-11-17', '2026-11-17')
    expect(logs.map((l) => [l.bookId ?? null, l.minutes]).sort()).toEqual([[book, 45], [null, 15]].sort())
    await character.updateBook(book, { status: 'done', endDate: '2026-12-01' })
    expect((await character.listBooks())[0]).toMatchObject({ status: 'done' })
  })

  it('Musik, Meilensteine, frühere Noten', async () => {
    await character.setMusicMinutes('2026-11-17', 20)
    await character.setMusicMinutes('2026-11-17', 35)
    expect(await character.listMusicLogs()).toMatchObject([{ minutes: 35 }])
    const ms = await character.createProjectMilestone('p', 'Gehäuse fertig', 'medium')
    await character.updateProjectMilestone(ms, { doneDate: '2026-11-17' })
    expect((await character.listProjectMilestones())[0]).toMatchObject({ size: 'medium', doneDate: '2026-11-17' })
    const g = await character.createPastGrade('ET1', 5, 1.0, 'WS 25/26')
    await character.updatePastGrade(g, { grade: 1.3 })
    expect((await character.listPastGrades())[0].grade).toBe(1.3)
  })

  it('Gewohnheit nur samstags anlegen', async () => {
    const id = await habits.createHabit('Aufräumen & Müll', '2026-11-16', [6])
    await habits.updateHabit(id, { skill: 'hygiene' })
    expect((await habits.listHabits()).find((h) => h.id === id)).toMatchObject({ weekdays: [6], skill: 'hygiene' })
  })
})
