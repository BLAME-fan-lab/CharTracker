import { describe, expect, it } from 'vitest'
import {
  breakDaysBetween,
  effectiveDays,
  moduleProgress,
  overallProgress,
  sollAt,
  sollTargetDate,
  sortModules,
  type UniConfig,
} from './uni'

/** WS 26/27 wie in der App */
const cfg: UniConfig = {
  sollStart: '2026-10-12',
  semesterTarget: '2027-02-15',
  bufferDays: 7,
  tolerancePp: 5,
  breaks: [{ start: '2026-12-21', end: '2027-01-08' }],
  pauseInBreaks: false,
}
const paused: UniConfig = { ...cfg, pauseInBreaks: true }

const units = (done: number, open: number) => [
  ...Array.from({ length: done }, () => ({ doneDate: '2026-11-01' })),
  ...Array.from({ length: open }, () => ({ doneDate: null })),
]

describe('sollTargetDate', () => {
  it('ohne Klausur: „alles fertig bis“', () => {
    expect(sollTargetDate(null, cfg)).toBe('2027-02-15')
  })
  it('Klausur − Puffer, wenn früher', () => {
    expect(sollTargetDate('2027-02-17', cfg)).toBe('2027-02-10')
  })
  it('„alles fertig bis“, wenn Klausur − Puffer später liegt', () => {
    expect(sollTargetDate('2027-03-05', cfg)).toBe('2027-02-15')
  })
})

describe('Pausen', () => {
  it('zählt Pausentage im Intervall', () => {
    // Weihnachtspause 21.12.–08.01. = 19 Tage
    expect(breakDaysBetween('2026-10-12', '2027-02-15', cfg.breaks)).toBe(19)
    expect(breakDaysBetween('2026-12-24', '2026-12-26', cfg.breaks)).toBe(2)
    expect(breakDaysBetween('2026-11-01', '2026-12-21', cfg.breaks)).toBe(0)
    expect(breakDaysBetween('2027-01-08', '2027-01-10', cfg.breaks)).toBe(1)
  })
  it('effectiveDays mit und ohne Pause', () => {
    expect(effectiveDays('2026-10-12', '2027-02-15', cfg)).toBe(126)
    expect(effectiveDays('2026-10-12', '2027-02-15', paused)).toBe(107)
    expect(effectiveDays('2027-02-15', '2026-10-12', cfg)).toBe(0)
  })
})

describe('sollAt', () => {
  const target = '2027-02-15'
  it('0 vor/bei Start, 100 % ab Zieldatum', () => {
    expect(sollAt('2026-10-01', target, cfg)).toBe(0)
    expect(sollAt('2026-10-12', target, cfg)).toBe(0)
    expect(sollAt('2027-02-15', target, cfg)).toBe(1)
    expect(sollAt('2027-03-01', target, cfg)).toBe(1)
  })
  it('linear dazwischen', () => {
    // 17.11.: 36 von 126 Tagen
    expect(sollAt('2026-11-17', target, cfg)).toBeCloseTo(36 / 126, 6)
  })
  it('mit Pause: Soll steht in der Weihnachtspause still', () => {
    const before = sollAt('2026-12-21', target, paused)
    const during = sollAt('2027-01-05', target, paused)
    const after = sollAt('2027-01-09', target, paused)
    expect(during).toBeCloseTo(before, 10)
    expect(after).toBeCloseTo(before, 10)
    expect(before).toBeCloseTo(70 / 107, 6)
  })
  it('Zieldatum vor Start → 100 % ab Start', () => {
    expect(sollAt('2026-10-12', '2026-10-01', cfg)).toBe(1)
  })
})

describe('moduleProgress', () => {
  const today = '2026-11-17'

  it('Ist, Soll, Abweichung und Status', () => {
    // Soll ≈ 28,6 %; 3/10 = 30 % → im Plan (+1,4 pp)
    const p = moduleProgress({ examDate: null }, units(3, 7), today, cfg)
    expect(p).toMatchObject({ total: 10, done: 3, open: 7, ist: 0.3, status: 'on_track', targetDate: '2027-02-15' })
    expect(p.deviationPp).toBeCloseTo(1.4, 5)
  })

  it('hinterher und voraus jenseits der Toleranz', () => {
    expect(moduleProgress({ examDate: null }, units(1, 9), today, cfg).status).toBe('behind') // 10 % vs 28,6 %
    expect(moduleProgress({ examDate: null }, units(4, 6), today, cfg).status).toBe('ahead') // 40 % vs 28,6 %
  })

  it('Grenze: genau Toleranz ist noch im Plan', () => {
    const p = moduleProgress({ examDate: null }, units(1, 3), '2026-10-12', { ...cfg, tolerancePp: 25 })
    expect(p.deviationPp).toBe(25)
    expect(p.status).toBe('on_track')
  })

  it('ohne Einheiten / fertig', () => {
    expect(moduleProgress({ examDate: null }, [], today, cfg)).toMatchObject({ status: 'no_units', ist: null, deviationPp: null })
    expect(moduleProgress({ examDate: null }, units(5, 0), today, cfg).status).toBe('done')
  })

  it('Klausurtermin: Tage bis Klausur und Einheiten pro Woche', () => {
    const p = moduleProgress({ examDate: '2027-02-17' }, units(2, 12), today, cfg)
    expect(p.targetDate).toBe('2027-02-10')
    expect(p.daysToExam).toBe(92)
    expect(p.daysRemaining).toBe(85) // bis 10.02.
    expect(p.unitsPerWeek).toBeCloseTo((12 / 85) * 7, 6)
  })

  it('nach dem Zieldatum: verbleibende Tage bis zur Klausur', () => {
    const p = moduleProgress({ examDate: '2027-02-17' }, units(2, 2), '2027-02-12', cfg)
    expect(p.soll).toBe(1)
    expect(p.daysRemaining).toBe(5)
    expect(p.unitsPerWeek).toBeCloseTo((2 / 5) * 7, 6)
  })

  it('Klausur vorbei', () => {
    const p = moduleProgress({ examDate: '2027-02-17' }, units(2, 2), '2027-02-20', cfg)
    expect(p).toMatchObject({ examPassed: true, daysRemaining: 0, unitsPerWeek: null, daysToExam: -3 })
  })

  it('Pause verlängert nicht die Wochenrate, wenn sie aus ist', () => {
    const a = moduleProgress({ examDate: null }, units(0, 10), '2026-12-01', cfg)
    const b = moduleProgress({ examDate: null }, units(0, 10), '2026-12-01', paused)
    expect(b.daysRemaining).toBe(a.daysRemaining - 19)
    expect(b.unitsPerWeek!).toBeGreaterThan(a.unitsPerWeek!)
  })
})

describe('sortModules', () => {
  const today = '2026-11-17'
  const mk = (id: string, order: number, exam: string | null, done: number, open: number) => ({
    id,
    order,
    progress: moduleProgress({ examDate: exam }, units(done, open), today, cfg),
  })
  const items = [
    mk('tm2', 0, '2027-02-20', 3, 7), // 30 % → +1,4
    mk('mathe', 1, '2027-02-16', 0, 10), // 0 % → −28,6
    mk('elektronik', 2, null, 1, 9), // 10 % → −18,6
    mk('leer', 3, '2027-02-15', 0, 0), // keine Einheiten
    mk('fertig', 4, '2027-02-18', 4, 0), // fertig
  ]

  it('nach Rückstand', () => {
    expect(sortModules(items, 'backlog').map((m) => m.id)).toEqual(['mathe', 'elektronik', 'tm2', 'leer', 'fertig'])
  })
  it('nach Klausur', () => {
    expect(sortModules(items, 'exam').map((m) => m.id)).toEqual(['mathe', 'tm2', 'elektronik', 'leer', 'fertig'])
  })
})

describe('overallProgress', () => {
  it('gewichtet nach Einheiten', () => {
    const today = '2026-11-17'
    const a = moduleProgress({ examDate: null }, units(3, 7), today, cfg)
    const b = moduleProgress({ examDate: null }, units(0, 10), today, cfg)
    const c = moduleProgress({ examDate: null }, [], today, cfg)
    const o = overallProgress([a, b, c])
    expect(o).toMatchObject({ total: 20, done: 3, ist: 0.15 })
    expect(o.soll).toBeCloseTo(36 / 126, 6)
    expect(overallProgress([c])).toEqual({ ist: null, soll: null, total: 0, done: 0 })
  })
})
