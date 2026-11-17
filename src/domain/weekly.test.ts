import { describe, expect, it } from 'vitest'
import { ratio, sumMinutes, trainingProgress, versionForWeek } from './weekly'

describe('versionForWeek', () => {
  const plans = [
    { id: 'b', validFrom: '2027-01-04' },
    { id: 'a', validFrom: '2026-11-16' },
  ]
  it('nimmt den letzten gültigen Plan', () => {
    expect(versionForWeek(plans, '2026-11-16')?.id).toBe('a')
    expect(versionForWeek(plans, '2026-12-28')?.id).toBe('a')
    expect(versionForWeek(plans, '2027-01-04')?.id).toBe('b')
    expect(versionForWeek(plans, '2027-03-01')?.id).toBe('b')
  })
  it('vor dem ersten Plan gilt der früheste', () => {
    expect(versionForWeek(plans, '2026-10-05')?.id).toBe('a')
  })
  it('leer → undefined', () => {
    expect(versionForWeek([], '2026-10-05')).toBeUndefined()
  })
})

describe('trainingProgress', () => {
  const plan = [
    { typeId: 'gym', count: 2 },
    { typeId: 'workout', count: 1 },
  ]
  const s = (...types: string[]) => types.map((typeId) => ({ typeId }))

  it('zählt pro Typ', () => {
    const p = trainingProgress(plan, s('gym', 'workout'))
    expect(p).toMatchObject({ done: 2, target: 3, extra: 0, total: 2 })
    expect(p.perType).toEqual([
      { typeId: 'gym', target: 2, done: 1, extra: 0 },
      { typeId: 'workout', target: 1, done: 1, extra: 0 },
    ])
  })

  it('drittes Gym ersetzt kein Workout, sondern ist +1', () => {
    const p = trainingProgress(plan, s('gym', 'gym', 'gym'))
    expect(p).toMatchObject({ done: 2, target: 3, extra: 1, total: 3 })
  })

  it('Typen ohne Soll zählen als Extra', () => {
    const p = trainingProgress(plan, s('gym', 'gym', 'workout', 'fussball'))
    expect(p).toMatchObject({ done: 3, target: 3, extra: 1, total: 4 })
  })

  it('Typen mit Soll 0 werden ignoriert', () => {
    const p = trainingProgress([...plan, { typeId: 'lauf', count: 0 }], s('lauf'))
    expect(p.perType).toHaveLength(2)
    expect(p.extra).toBe(1)
  })
})

describe('Hilfen', () => {
  it('sumMinutes und ratio', () => {
    const logs = [
      { moduleId: 'tm2', minutes: 90 },
      { moduleId: null, minutes: 30 },
    ]
    expect(sumMinutes(logs)).toBe(120)
    expect(sumMinutes(logs, (l) => l.moduleId === 'tm2')).toBe(90)
    expect(ratio(30, 60)).toBe(0.5)
    expect(ratio(90, 60)).toBe(1)
    expect(ratio(0, 0)).toBe(1)
  })
})
