import { todayStr, weekStartOf } from '../lib/dates'
import { created, newId } from './base'
import type { TrackerDB } from './db'
import type { AppSettings, BaseRecord, Module } from './types'

/**
 * Startdaten beim allerersten Öffnen der App.
 * Alles hier ist später in den Einstellungen änderbar.
 */
export async function seedDatabase(db: TrackerDB): Promise<void> {
  const today = todayStr()
  // Gewohnheiten zählen ab Montag dieser Woche, damit die laufende Woche nachgetragen werden kann.
  const thisMonday = weekStartOf(today)

  const habitNames = [
    'Pünktlich aufgestanden',
    'Zähne geputzt morgens',
    'Zähne geputzt abends',
    'Geduscht',
    'Schlaf im Zielbereich (6:30–8 h)',
  ]
  await db.habits.bulkAdd(
    habitNames.map((name, i) => created({ name, order: i, activeFrom: thisMonday, archivedFrom: null })),
  )

  const gymId = newId()
  const workoutId = newId()
  await db.trainingTypes.bulkAdd([
    created({ name: 'Gym', order: 0, archived: false }, gymId),
    created({ name: 'Workout', order: 1, archived: false }, workoutId),
  ])
  await db.trainingPlans.add(
    created({
      validFrom: thisMonday,
      targets: [
        { typeId: gymId, count: 2 },
        { typeId: workoutId, count: 1 },
      ],
    }),
  )

  await db.goalTargets.bulkAdd([
    created({ kind: 'reading' as const, validFrom: thisMonday, minutes: 60 }),
    created({ kind: 'study' as const, validFrom: thisMonday, minutes: 40 * 60 }),
  ])

  await db.projects.add(created({ name: 'Technisches Projekt', order: 0, active: true }))

  const categories: [string, string][] = [
    ['Uni', '#38bdf8'],
    ['Arbeit', '#f59e0b'],
    ['Privat', '#a78bfa'],
    ['Sport', '#34d399'],
  ]
  await db.todoCategories.bulkAdd(
    categories.map(([name, color], i) => created({ name, color, order: i, archived: false })),
  )

  const semesterId = newId()
  await db.semesters.add(
    created(
      {
        name: 'WS 2026/27',
        start: '2026-10-01',
        end: '2027-03-31',
        lectureStart: '2026-10-12',
        lectureEnd: '2027-02-12',
        lectureFreeStart: '2027-02-15',
        lectureFreeEnd: '2027-04-09',
        breaks: [{ name: 'Weihnachtspause', start: '2026-12-21', end: '2027-01-08' }],
        targetDate: '2027-02-15',
        active: true,
      },
      semesterId,
    ),
  )

  const modules: [string, string][] = [
    ['Technische Mechanik 2', 'TM2'],
    ['Mathe 2', 'Mathe 2'],
    ['Elektronik', 'Elektronik'],
    ['Elektrische Maschinen und Antriebe', 'EMA'],
    ['ET3', 'ET3'],
    ['Energietechnik', 'Energietechnik'],
    ['Messtechnik', 'Messtechnik'],
  ]
  await db.modules.bulkAdd(
    modules.map(([name, shortName], i) =>
      created<Omit<Module, keyof BaseRecord>>({
        semesterId,
        name,
        shortName,
        examDate: null,
        examTime: null,
        order: i,
        archived: false,
      }),
    ),
  )

  const settings: Omit<AppSettings, keyof BaseRecord> = {
    studyBufferDays: 7,
    statusTolerancePp: 5,
    pauseSollInBreaks: false,
    trackingStart: thisMonday,
  }
  await db.settings.add(created(settings, 'app'))
}
