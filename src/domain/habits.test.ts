import { describe, expect, it } from 'vitest'
import {
  bestHabitStreak,
  bestPerfectDayStreak,
  dayCompletion,
  DoneIndex,
  habitStreak,
  isHabitActiveOn,
  perfectDayStreak,
  type HabitDone,
  type HabitSpan,
} from './habits'

const A: HabitSpan = { id: 'a', activeFrom: '2026-11-01', archivedFrom: null }
const B: HabitSpan = { id: 'b', activeFrom: '2026-11-10', archivedFrom: '2026-11-15' }

const logs = (habitId: string, dates: string[], done = true): HabitDone[] =>
  dates.map((date) => ({ habitId, date, done }))

describe('isHabitActiveOn', () => {
  it('respektiert Start und Archivierung', () => {
    expect(isHabitActiveOn(A, '2026-10-31')).toBe(false)
    expect(isHabitActiveOn(A, '2026-11-01')).toBe(true)
    expect(isHabitActiveOn(B, '2026-11-14')).toBe(true)
    expect(isHabitActiveOn(B, '2026-11-15')).toBe(false)
  })
})

describe('dayCompletion', () => {
  it('zählt nur an dem Tag aktive Gewohnheiten', () => {
    const done = new DoneIndex(logs('a', ['2026-11-12']))
    expect(dayCompletion([A, B], done, '2026-11-12')).toEqual({ active: 2, done: 1, ratio: 0.5 })
    expect(dayCompletion([A, B], done, '2026-11-16')).toEqual({ active: 1, done: 0, ratio: 0 })
    expect(dayCompletion([A, B], done, '2026-10-01')).toEqual({ active: 0, done: 0, ratio: null })
  })

  it('ignoriert wieder abgehakte Einträge (done = false)', () => {
    const done = new DoneIndex([...logs('a', ['2026-11-12'], false)])
    expect(dayCompletion([A], done, '2026-11-12').done).toBe(0)
  })
})

describe('habitStreak', () => {
  it('zählt Tage am Stück inklusive heute', () => {
    const done = new DoneIndex(logs('a', ['2026-11-15', '2026-11-16', '2026-11-17']))
    expect(habitStreak(A, done, '2026-11-17')).toBe(3)
  })

  it('heute noch offen bricht die Serie nicht', () => {
    const done = new DoneIndex(logs('a', ['2026-11-15', '2026-11-16']))
    expect(habitStreak(A, done, '2026-11-17')).toBe(2)
  })

  it('eine Lücke beendet die Serie', () => {
    const done = new DoneIndex(logs('a', ['2026-11-13', '2026-11-15', '2026-11-16']))
    expect(habitStreak(A, done, '2026-11-17')).toBe(2)
  })

  it('gestern offen → 0', () => {
    const done = new DoneIndex(logs('a', ['2026-11-14', '2026-11-15']))
    expect(habitStreak(A, done, '2026-11-17')).toBe(0)
  })

  it('zählt nicht vor dem Start der Gewohnheit', () => {
    const done = new DoneIndex(logs('a', ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']))
    expect(habitStreak(A, done, '2026-11-02')).toBe(2)
  })

  it('Monats- und Jahreswechsel', () => {
    const h: HabitSpan = { id: 'x', activeFrom: '2026-12-01', archivedFrom: null }
    const done = new DoneIndex(logs('x', ['2026-12-30', '2026-12-31', '2027-01-01']))
    expect(habitStreak(h, done, '2027-01-01')).toBe(3)
  })
})

describe('perfectDayStreak', () => {
  it('alle aktiven Gewohnheiten müssen erfüllt sein', () => {
    const done = new DoneIndex([
      ...logs('a', ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16']),
      ...logs('b', ['2026-11-13', '2026-11-14']),
    ])
    // 12.: b fehlt → nicht perfekt; 13., 14. perfekt; ab 15. ist b archiviert → nur a zählt
    expect(perfectDayStreak([A, B], done, '2026-11-17')).toBe(4)
    expect(bestPerfectDayStreak([A, B], done, '2026-11-17')).toBe(4)
  })

  it('ohne Gewohnheiten 0', () => {
    expect(perfectDayStreak([], new DoneIndex([]), '2026-11-17')).toBe(0)
  })
})

describe('bestHabitStreak', () => {
  it('findet die längste Serie', () => {
    const done = new DoneIndex(
      logs('a', ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06']),
    )
    expect(bestHabitStreak(A, done, '2026-11-17')).toBe(3)
  })
})
