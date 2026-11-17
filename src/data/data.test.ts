import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import * as habits from './repo/habits'
import * as todos from './repo/todos'
import * as uni from './repo/uni'
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


describe('todosRepo', () => {
  it('anlegen, bearbeiten, erledigen, löschen', async () => {
    const [uni] = await todos.listTodoCategories()
    const id = await todos.createTodo({ title: '  Übungsblatt 5 ', dueDate: '2026-11-20', priority: 'high', categoryId: uni.id, note: '  ' })
    let [t] = await todos.listTodos()
    expect(t).toMatchObject({ id, title: 'Übungsblatt 5', note: null, doneDate: null })

    await todos.updateTodo(id, { dueDate: null, note: 'Aufgabe 3 offen' })
    await todos.setTodoDone(id, true, '2026-11-18')
    ;[t] = await todos.listTodos()
    expect(t).toMatchObject({ dueDate: null, note: 'Aufgabe 3 offen', doneDate: '2026-11-18' })

    await todos.deleteTodo(id)
    expect(await todos.listTodos()).toHaveLength(0)
  })

  it('Kategorien anlegen und archivieren', async () => {
    const id = await todos.createTodoCategory('Haushalt')
    await todos.setTodoCategoryArchived(id, true)
    const cats = await todos.listTodoCategories()
    expect(cats.map((c) => c.name)).toEqual(['Uni', 'Arbeit', 'Privat', 'Sport', 'Haushalt'])
    expect(cats.at(-1)?.archived).toBe(true)
  })
})

describe('uniRepo', () => {
  it('Module bearbeiten, Lerneinheiten anlegen, Serie, erledigen', async () => {
    const [tm2] = await uni.listActiveModules()
    await uni.updateModule(tm2.id, { examDate: '2027-02-17', examTime: '09:00' })
    expect((await uni.listActiveModules())[0]).toMatchObject({ shortName: 'TM2', examDate: '2027-02-17', examTime: '09:00' })

    const id = await uni.createStudyUnit(tm2.id, { title: ' Kapitel 1 ', type: 'script', dueDate: null })
    expect(await uni.createStudyUnitSeries(tm2.id, 'Übungsblatt', 1, 3, 'sheet')).toBe(3)
    let units = (await uni.listStudyUnits()).filter((u) => u.moduleId === tm2.id)
    expect(units.map((u) => u.title)).toEqual(['Kapitel 1', 'Übungsblatt 1', 'Übungsblatt 2', 'Übungsblatt 3'])

    await uni.setStudyUnitDone(id, true, '2026-11-17')
    await uni.updateStudyUnit(units[1].id, { dueDate: '2026-11-20' })
    await uni.deleteStudyUnit(units[3].id)
    units = (await uni.listStudyUnits()).filter((u) => u.moduleId === tm2.id)
    expect(units).toHaveLength(3)
    expect(units[0].doneDate).toBe('2026-11-17')
    expect(units[1].dueDate).toBe('2026-11-20')
  })

  it('Module anlegen, verschieben, archivieren; Semester ändern', async () => {
    const semester = (await uni.getActiveSemester())!
    const id = await uni.createModule(semester.id, 'Regelungstechnik', 'RT')
    await uni.moveModule(id, -1)
    let modules = await uni.listActiveModules()
    expect(modules.map((m) => m.shortName).slice(-2)).toEqual(['RT', 'Messtechnik'])
    await uni.setModuleArchived(id, true)
    modules = await uni.listActiveModules()
    expect(modules).toHaveLength(7)
    await uni.updateSemester(semester.id, { targetDate: '2027-02-12' })
    expect((await uni.getActiveSemester())?.targetDate).toBe('2027-02-12')
  })

  it('Liste anlegen (mit erledigten) und Modul-Notiz', async () => {
    const modules = await uni.listActiveModules()
    const mt = modules.find((m) => m.shortName === 'Messtechnik')!
    const n = await uni.createStudyUnits(
      mt.id,
      [
        { title: 'Kapitel 1: Grundlagen', type: 'script', done: true },
        { title: 'Probeklausur', type: 'mock_exam', done: false },
      ],
      '2026-11-17',
    )
    expect(n).toBe(2)
    const units = (await uni.listStudyUnits()).filter((u) => u.moduleId === mt.id)
    expect(units.map((u) => [u.title, u.doneDate])).toEqual([
      ['Kapitel 1: Grundlagen', '2026-11-17'],
      ['Probeklausur', null],
    ])
    await uni.updateModule(mt.id, { note: '60 min, Folien erlaubt' })
    expect((await uni.listActiveModules()).find((m) => m.id === mt.id)?.note).toBe('60 min, Folien erlaubt')
  })

  it('Import mehrerer Module, optional mit Ersetzen', async () => {
    const [tm2, mathe] = await uni.listActiveModules()
    await uni.createStudyUnit(tm2.id, { title: 'Alt', type: 'script', dueDate: null })
    const unit = (title: string, dueDate: string | null = null) => ({ title, type: 'sheet' as const, done: false, dueDate })
    expect(await uni.importStudyUnits([{ moduleId: tm2.id, units: [unit('Übung 1', '2026-11-19')] }], false)).toBe(1)
    expect((await uni.listStudyUnits()).filter((u) => u.moduleId === tm2.id).map((u) => u.title)).toEqual(['Alt', 'Übung 1'])

    await uni.importStudyUnits(
      [
        { moduleId: tm2.id, units: [unit('Neu 1'), unit('Neu 2')] },
        { moduleId: mathe.id, units: [unit('Blatt 1')] },
      ],
      true,
    )
    const units = await uni.listStudyUnits()
    expect(units.filter((u) => u.moduleId === tm2.id).map((u) => u.title)).toEqual(['Neu 1', 'Neu 2'])
    expect(units.filter((u) => u.moduleId === mathe.id).map((u) => u.title)).toEqual(['Blatt 1'])
  })
})
