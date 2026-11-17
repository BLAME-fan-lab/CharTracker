import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import * as habits from './repo/habits'
import * as goals from './repo/goals'
import * as training from './repo/training'
import * as projects from './repo/projects'
import { versionForWeek } from '../domain/weekly'

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

describe('trainingRepo', () => {
  it('neuer Plan ab Woche ersetzt spätere Pläne, ältere bleiben', async () => {
    const [gym, workout] = await training.listTrainingTypes()
    const [initial] = await training.listTrainingPlans()
    await training.saveTrainingPlan('2027-01-04', [{ typeId: gym.id, count: 3 }])
    await training.saveTrainingPlan('2027-03-01', [{ typeId: workout.id, count: 1 }])
    await training.saveTrainingPlan('2027-02-01', [{ typeId: gym.id, count: 1 }, { typeId: workout.id, count: 0 }])
    const plans = await training.listTrainingPlans()
    expect(plans.map((p) => p.validFrom)).toEqual([initial.validFrom, '2027-01-04', '2027-02-01'])
    expect(plans[2].targets).toEqual([{ typeId: gym.id, count: 1 }])
    expect(versionForWeek(plans, '2027-01-11')?.validFrom).toBe('2027-01-04')
  })

  it('Einheiten pro Tag', async () => {
    const [gym] = await training.listTrainingTypes()
    const id = await training.addTrainingSession('2026-11-17', gym.id)
    await training.addTrainingSession('2026-11-17', gym.id)
    expect(await training.listTrainingSessions('2026-11-16', '2026-11-22')).toHaveLength(2)
    await training.deleteTrainingSession(id)
    expect(await training.listTrainingSessions('2026-11-16', '2026-11-22')).toHaveLength(1)
  })
})

describe('goalsRepo', () => {
  it('Lernzeit pro Tag und Modul wird überschrieben, nicht addiert', async () => {
    await goals.setStudyMinutes('2026-11-17', 'tm2', 90)
    await goals.setStudyMinutes('2026-11-17', 'tm2', 120)
    await goals.setStudyMinutes('2026-11-17', null, 30)
    const logs = await goals.listStudyLogs('2026-11-17', '2026-11-17')
    expect(logs.map((l) => [l.moduleId, l.minutes]).sort()).toEqual([
      [null, 30],
      ['tm2', 120],
    ].sort())
  })

  it('Soll ab Woche', async () => {
    await goals.saveGoalTarget('study', '2027-02-15', 20 * 60)
    const study = (await goals.listGoalTargets()).filter((t) => t.kind === 'study')
    expect(versionForWeek(study, '2027-02-08')?.minutes).toBe(2400)
    expect(versionForWeek(study, '2027-02-15')?.minutes).toBe(1200)
  })

  it('Lesen pro Tag', async () => {
    await goals.setReadingMinutes('2026-11-17', 25)
    await goals.setReadingMinutes('2026-11-17', 40)
    expect((await goals.listReadingLogs('2026-11-17', '2026-11-17'))[0].minutes).toBe(40)
  })
})

describe('projectsRepo', () => {
  it('Zeit und Wochennotiz', async () => {
    const [p] = await projects.listProjects()
    await projects.setProjectMinutes(p.id, '2026-11-18', 45)
    await projects.setProjectNote(p.id, '2026-11-16', 'Gehäuse konstruiert')
    expect((await projects.listProjectLogs('2026-11-16', '2026-11-22'))[0].minutes).toBe(45)
    expect((await projects.getProjectNote(p.id, '2026-11-16'))?.text).toBe('Gehäuse konstruiert')
  })
})
