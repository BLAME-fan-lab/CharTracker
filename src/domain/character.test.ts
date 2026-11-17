import { describe, expect, it } from 'vitest'
import {
  academicLevel,
  characterLevel,
  DAILY_DOWN,
  DAILY_UP,
  detrainingFactor,
  disciplineLevel,
  displayLevel,
  estimate1RM,
  fiveKEquivalent,
  gradeToLevel,
  healthLevel,
  liftLevel,
  musicLevel,
  projectLevel,
  pullupEquivalentReps,
  readingLevel,
  runLevel,
  sportLevel,
  thresholdLevel,
  WEEKLY_DOWN,
  WEEKLY_UP,
  bmi,
  bmiScore,
} from './character'

const days = (n: number, a: number) => Array.from({ length: n }, () => a)

describe('Disziplin', () => {
  it('ein Jahr perfekt → 900, zwei Jahre → 990, nie 1000', () => {
    expect(disciplineLevel(days(365, 1), DAILY_UP, DAILY_DOWN)).toBeCloseTo(900, 5)
    expect(disciplineLevel(days(730, 1), DAILY_UP, DAILY_DOWN)).toBeCloseTo(990, 5)
    expect(displayLevel(disciplineLevel(days(5000, 1), DAILY_UP, DAILY_DOWN))).toBeLessThan(1000)
    expect(disciplineLevel(days(52, 1), WEEKLY_UP, WEEKLY_DOWN)).toBeCloseTo(900, 5)
  })
  it('halbe Erfüllung führt Richtung 500; Nachlassen senkt langsamer', () => {
    expect(disciplineLevel(days(3000, 0.5), DAILY_UP, DAILY_DOWN)).toBeCloseTo(500, 0)
    const top = disciplineLevel(days(365, 1), DAILY_UP, DAILY_DOWN)
    const after = disciplineLevel([...days(365, 1), ...days(30, 0)], DAILY_UP, DAILY_DOWN)
    expect(after).toBeLessThan(top)
    expect(after).toBeGreaterThan(top * 0.9)
  })
  it('null-Perioden zählen nicht', () => {
    expect(disciplineLevel([1, null, null, 1], DAILY_UP, DAILY_DOWN)).toBeCloseTo(disciplineLevel([1, 1], DAILY_UP, DAILY_DOWN))
  })
})

describe('Akademisch', () => {
  it('Note → Level', () => {
    expect(gradeToLevel(1.0)).toBe(1000)
    expect(gradeToLevel(1.7)).toBe(825)
    expect(gradeToLevel(4.0)).toBe(250)
  })
  it('ECTS-gewichteter Durchschnitt, nicht bestandene zählen nicht', () => {
    const r = academicLevel([
      { grade: 1.0, ects: 5 },
      { grade: 1.7, ects: 5 },
      { grade: 5.0, ects: 5 },
    ])
    expect(r.average).toBeCloseTo(1.35)
    expect(r.count).toBe(2)
    expect(r.gradeLevel).toBeCloseTo(912.5)
    expect(r.level).toBeCloseTo(912.5 * (1 - Math.exp(-10 / 60)))
    expect(academicLevel([]).level).toBe(0)
  })
  it('1000 nur annähernd: eine 1,0 reicht nicht, ein ganzes Studium fast', () => {
    expect(academicLevel([{ grade: 1.0, ects: 5 }]).level).toBeLessThan(100)
    const bachelor = academicLevel([{ grade: 1.0, ects: 180 }]).level
    expect(bachelor).toBeGreaterThan(945)
    expect(bachelor).toBeLessThan(955)
    expect(displayLevel(academicLevel([{ grade: 1.0, ects: 300 }]).level)).toBe(993)
  })
})

describe('Sport', () => {
  it('Schwellen: linear, über Elite asymptotisch', () => {
    const t = [0.5, 0.75, 1.0, 1.5, 2.0]
    expect(thresholdLevel(0.25, t)).toBeCloseTo(75)
    expect(thresholdLevel(1.0, t)).toBe(500)
    expect(thresholdLevel(1.25, t)).toBe(600)
    expect(thresholdLevel(2.0, t)).toBe(850)
    expect(thresholdLevel(3.0, t)).toBeGreaterThan(950)
    expect(displayLevel(thresholdLevel(10, t))).toBeLessThan(1000)
  })
  it('1RM, Klimmzüge mit Zusatzgewicht, Trainingspause', () => {
    expect(estimate1RM(80, 1)).toBe(80)
    expect(estimate1RM(75, 6)).toBeCloseTo(90)
    expect(pullupEquivalentReps(8, 0, 80)).toBe(8)
    expect(pullupEquivalentReps(5, 20, 80)).toBeGreaterThan(10)
    expect(detrainingFactor(30)).toBe(1)
    expect(detrainingFactor(56 + 70)).toBeCloseTo(0.9)
    expect(detrainingFactor(5000)).toBe(0.6)
  })
  it('Bankdrücken 1× Körpergewicht → Mittel (500)', () => {
    expect(liftLevel('bench', 'm', 80, [{ ageDays: 3, weightKg: 80, reps: 1 }])).toBe(500)
    // Bester Wert zählt
    expect(liftLevel('bench', 'm', 80, [{ ageDays: 3, weightKg: 60, reps: 1 }, { ageDays: 10, weightKg: 80, reps: 1 }])).toBe(500)
    expect(liftLevel('pullup', 'm', 80, [{ ageDays: 0, weightKg: 0, reps: 10 }])).toBe(500)
    expect(liftLevel('bench', 'm', 0, [{ ageDays: 0, weightKg: 80, reps: 1 }])).toBe(0)
  })
  it('Laufen: 5-km-Äquivalent und Level', () => {
    expect(fiveKEquivalent(1500, 5)).toBe(1500)
    expect(fiveKEquivalent(3000, 10)).toBeLessThan(1500)
    expect(runLevel(1800, 'm')).toBe(300)
    expect(runLevel(1650, 'm')).toBeCloseTo(375)
    expect(runLevel(1200, 'm')).toBe(700)
    expect(runLevel(1200 * 1.12, 'f')).toBeCloseTo(700)
    expect(runLevel(700, 'm')).toBe(999)
  })
  it('Sport = 60 % Leistung + 40 % Konstanz', () => {
    expect(sportLevel([500, 300], 900)).toEqual({ level: 0.6 * 400 + 360, performance: 400 })
    expect(sportLevel([], 500).level).toBe(200)
  })
})

describe('Gesundheit', () => {
  it('BMI-Wertung', () => {
    expect(bmi(75, 180)).toBeCloseTo(23.15, 2)
    expect(bmiScore(22)).toBe(1)
    expect(bmiScore(30)).toBeCloseTo(0.5)
    expect(bmiScore(16.75)).toBeCloseTo(0.5)
  })
  it('Routinen und Körper', () => {
    expect(healthLevel(900, null)).toBe(900)
    expect(healthLevel(900, 1)).toBe(930)
  })
})

describe('Lesen', () => {
  it('nur leichte Bücher bleiben unter 500', () => {
    const r = readingLevel({ easy: 1_000_000, medium: 0, hard: 0 }, 1000)
    expect(r.cap).toBe(500)
    expect(r.level).toBeLessThanOrEqual(500)
    expect(r.level).toBeGreaterThan(490)
  })
  it('schwere Bücher zählen mehr', () => {
    const easy = readingLevel({ easy: 6000, medium: 0, hard: 0 }, 500).level
    const hard = readingLevel({ easy: 0, medium: 0, hard: 6000 }, 500).level
    expect(hard).toBeGreaterThan(easy * 2)
  })
  it('ohne Lesen 0', () => {
    expect(readingLevel({ easy: 0, medium: 0, hard: 0 }, 900).level).toBe(0)
  })
})

describe('Musik', () => {
  it('Einstieg mit etwas Übung ≈ Level 1, gedeckelt unter dem nächsten Meilenstein', () => {
    expect(displayLevel(musicLevel(0, 5))).toBe(1)
    expect(musicLevel(0, 1000)).toBe(39)
    expect(musicLevel(3, 0)).toBe(180)
    expect(musicLevel(11, 1e9)).toBe(999)
  })
})

describe('Projekt und Charakter', () => {
  it('Projekt wächst mit Stunden, Meilensteinen und Konstanz', () => {
    expect(projectLevel(0, 0, 0)).toBe(0)
    const a = projectLevel(150, 10, 600)
    expect(a).toBeGreaterThan(150)
    expect(a).toBeLessThan(300)
    expect(displayLevel(projectLevel(1e7, 1e7, 999))).toBeLessThan(1000)
  })
  it('Charakterlevel = Durchschnitt', () => {
    expect(characterLevel([1000, 0, 500])).toBe(500)
    expect(characterLevel([])).toBe(0)
  })
})
