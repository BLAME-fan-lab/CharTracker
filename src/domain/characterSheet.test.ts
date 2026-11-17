import { describe, expect, it } from 'vitest'
import { addDaysStr, daysInRange } from '../lib/dates'
import { computeCharacter, habitSkill, type CharacterInput } from './characterSheet'

const base = { createdAt: 0, updatedAt: 0, deletedAt: null }
const TODAY = '2026-11-17'

function input(patch: Partial<CharacterInput> = {}): CharacterInput {
  return {
    today: TODAY,
    trackingStart: '2026-11-16',
    habits: [],
    habitLogs: [],
    trainingPlans: [],
    trainingSessions: [],
    goalTargets: [],
    readingLogs: [],
    books: [],
    modules: [],
    pastGrades: [],
    profile: { ...base, id: 'me', birthDate: '2005-03-01', heightCm: 180, sex: 'm', instrument: 'Klavier', musicMilestone: 0 },
    bodyLogs: [],
    exercises: [],
    liftLogs: [],
    runLogs: [],
    musicLogs: [],
    projectLogs: [],
    projectMilestones: [],
    ...patch,
  }
}
const level = (sheet: ReturnType<typeof computeCharacter>, key: string) => sheet.skills.find((s) => s.key === key)!.level

describe('habitSkill', () => {
  it('ordnet nach Name zu, ausdrückliche Wahl gewinnt', () => {
    expect(habitSkill({ name: 'Zähne geputzt morgens' })).toBe('hygiene')
    expect(habitSkill({ name: 'Geduscht' })).toBe('hygiene')
    expect(habitSkill({ name: 'Aufräumen & Müll' })).toBe('hygiene')
    expect(habitSkill({ name: 'Schlaf im Zielbereich (6:30–8 h)' })).toBe('health')
    expect(habitSkill({ name: 'Pünktlich aufgestanden' })).toBe('health')
    expect(habitSkill({ name: 'Vokabeln' })).toBe('none')
    expect(habitSkill({ name: 'Geduscht', skill: 'none' })).toBe('none')
  })
})

describe('computeCharacter', () => {
  it('leerer Start: alles 0, Alter und Hinweise', () => {
    const s = computeCharacter(input())
    expect(s.level).toBe(0)
    expect(s.age).toBe(21)
    expect(s.skills).toHaveLength(7)
    expect(s.skills.find((x) => x.key === 'academic')!.hint).toMatch(/Noten/)
  })

  it('Akademisch aus früheren Noten und Modulnoten', () => {
    const s = computeCharacter(
      input({
        pastGrades: [
          { ...base, id: 'a', name: 'ET1', ects: 5, grade: 1.0, semester: null },
          { ...base, id: 'b', name: 'Statik', ects: 5, grade: 1.7, semester: null },
        ],
        modules: [
          { ...base, id: 'm', semesterId: 's', name: 'Mathe 2', shortName: 'Mathe 2', examDate: null, examTime: null, order: 0, archived: false, grade: 5.0 },
        ],
      }),
    )
    expect(level(s, 'academic')).toBeCloseTo(912.5)
  })

  it('Hygiene steigt mit erledigten Routinen über Zeit', () => {
    const from = '2025-11-17'
    const habit = { ...base, id: 'h', name: 'Zähne geputzt abends', order: 0, activeFrom: from, archivedFrom: null }
    const logs = daysInRange(from, addDaysStr(TODAY, -1)).map((date) => ({ ...base, id: `h_${date}`, habitId: 'h', date, done: true }))
    const s = computeCharacter(input({ trackingStart: from, habits: [habit], habitLogs: logs }))
    expect(level(s, 'hygiene')).toBeGreaterThan(895)
    expect(level(s, 'hygiene')).toBeLessThan(901)
  })

  it('Sport: Bankdrücken 1× Körpergewicht → Leistung 500', () => {
    const s = computeCharacter(
      input({
        bodyLogs: [{ ...base, id: 'b', date: TODAY, weightKg: 80, bodyFatPct: null }],
        exercises: [{ ...base, id: 'e', name: 'Bankdrücken', standard: 'bench', order: 0, archived: false }],
        liftLogs: [{ ...base, id: 'l', exerciseId: 'e', date: TODAY, weightKg: 80, reps: 1, source: 'manual' }],
      }),
    )
    const sport = s.skills.find((x) => x.key === 'sport')!
    expect(sport.details.find((d) => d.label === 'Leistung')!.value).toBe('500')
    expect(sport.level).toBeCloseTo(300)
    expect(s.bmi).toBeCloseTo(24.69, 2)
  })

  it('Lesen: Bücher ohne Zuordnung zählen als mittel, schwere Bücher heben die Obergrenze', () => {
    const books = [{ ...base, id: 'k', title: 'Kant', difficulty: 'hard' as const, status: 'reading' as const, startDate: null, endDate: null }]
    const s = computeCharacter(
      input({
        books,
        readingLogs: [
          { ...base, id: 'r1', date: '2026-11-16', minutes: 60, bookId: 'k' },
          { ...base, id: 'r2', date: '2026-11-17', minutes: 60 },
        ],
      }),
    )
    const r = s.skills.find((x) => x.key === 'reading')!
    expect(r.details.find((d) => d.label === 'Obergrenze nach Schwierigkeit')!.value).toBe('900')
    expect(r.level).toBeGreaterThan(0)
  })

  it('Musik: Einstieg mit 5 h Übung ≈ Level 1; Charakter = Durchschnitt', () => {
    const s = computeCharacter(input({ musicLogs: [{ ...base, id: 'x', date: TODAY, minutes: 300 }] }))
    expect(Math.floor(level(s, 'music'))).toBe(1)
    expect(s.level).toBeCloseTo(level(s, 'music') / 7)
  })
})
