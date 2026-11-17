/*
 * Charakter: 7 Skill-Bäume auf einer Skala von 0 bis 1000, Charakterlevel = Durchschnitt.
 * Alle Kurven nähern sich 1000 nur an – 1000 selbst ist praktisch nicht erreichbar.
 */

export const MAX_LEVEL = 1000

export const clamp = (v: number, lo = 0, hi = MAX_LEVEL) => Math.max(lo, Math.min(hi, v))
/** Anzeige: abgerundet, damit 999,7 nicht als 1000 erscheint */
export const displayLevel = (v: number) => Math.floor(clamp(v))

/* ---------- Disziplin (Konstanz über lange Zeit) ---------- */

/** Pro Tag: ein Jahr durchgehend erfüllt → 900. Nachlassen senkt das Level halb so schnell. */
export const DAILY_UP = 1 - Math.pow(0.1, 1 / 365)
export const DAILY_DOWN = DAILY_UP / 2
/** Pro Woche: 52 Wochen erfüllt → 900 */
export const WEEKLY_UP = 1 - Math.pow(0.1, 1 / 52)
export const WEEKLY_DOWN = WEEKLY_UP / 2

/**
 * Gleitendes Disziplin-Level aus einer Folge von Erfüllungsgraden (0–1, null = Periode zählt nicht).
 * Jede Periode zieht das Level ein Stück Richtung 1000 × Erfüllung.
 */
export function disciplineLevel(series: readonly (number | null)[], up: number, down: number): number {
  let level = 0
  for (const a of series) {
    if (a == null) continue
    const target = MAX_LEVEL * Math.max(0, Math.min(1, a))
    level += (target > level ? up : down) * (target - level)
  }
  return level
}

/* ---------- Akademisch ---------- */

/** 1,0 → 1000, 2,0 → 750, 3,0 → 500, 4,0 → 250 */
export const gradeToLevel = (grade: number) => clamp(1000 - (grade - 1) * 250)

export interface GradeEntry {
  grade: number
  ects: number
}

/** ECTS-gewichteter Durchschnitt der bestandenen Noten (≤ 4,0) → Level. */
export function academicLevel(grades: readonly GradeEntry[]): { level: number; average: number | null; ects: number; count: number } {
  const passed = grades.filter((g) => g.grade >= 1 && g.grade <= 4 && g.ects > 0)
  const ects = passed.reduce((a, g) => a + g.ects, 0)
  if (ects === 0) return { level: 0, average: null, ects: 0, count: 0 }
  const average = passed.reduce((a, g) => a + g.grade * g.ects, 0) / ects
  return { level: gradeToLevel(average), average, ects, count: passed.length }
}

/* ---------- Sport ---------- */

export type LiftStandardKey = 'bench' | 'squat' | 'deadlift' | 'ohp' | 'row' | 'pullup'
export type SexKey = 'm' | 'f'

/**
 * Kraft-Standards (Anfänger, Fortgeschrittener Anfänger, Mittel, Fortgeschritten, Elite),
 * angelehnt an gängige Tabellen. Kraftübungen: 1RM ÷ Körpergewicht; Klimmzüge: Wiederholungen.
 */
export const STRENGTH_STANDARDS: Record<LiftStandardKey, Record<SexKey, number[]>> = {
  bench: { m: [0.5, 0.75, 1.0, 1.5, 2.0], f: [0.25, 0.5, 0.75, 1.0, 1.5] },
  squat: { m: [0.75, 1.25, 1.5, 2.25, 2.75], f: [0.5, 0.75, 1.25, 1.5, 2.0] },
  deadlift: { m: [1.0, 1.5, 2.0, 2.5, 3.0], f: [0.5, 1.0, 1.25, 1.75, 2.5] },
  ohp: { m: [0.35, 0.55, 0.75, 1.0, 1.35], f: [0.2, 0.35, 0.5, 0.75, 1.0] },
  row: { m: [0.5, 0.75, 1.0, 1.5, 1.75], f: [0.25, 0.4, 0.65, 0.9, 1.2] },
  pullup: { m: [1, 5, 10, 18, 25], f: [1, 2, 5, 10, 15] },
}
export const STANDARD_LEVELS = [150, 300, 500, 700, 850]
export const STANDARD_NAMES = ['Anfänger', 'Fortgeschr. Anfänger', 'Mittel', 'Fortgeschritten', 'Elite']

/** Wert gegen Schwellen: linear zwischen den Stufen, über „Elite“ asymptotisch Richtung 1000. */
export function thresholdLevel(value: number, thresholds: readonly number[], levels: readonly number[] = STANDARD_LEVELS): number {
  if (value <= 0) return 0
  if (value < thresholds[0]) return (levels[0] * value) / thresholds[0]
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (value < thresholds[i + 1]) {
      const t = (value - thresholds[i]) / (thresholds[i + 1] - thresholds[i])
      return levels[i] + t * (levels[i + 1] - levels[i])
    }
  }
  const last = thresholds[thresholds.length - 1]
  const top = levels[levels.length - 1]
  return top + (MAX_LEVEL - top) * (1 - Math.exp(-(value - last) / (last * 0.25)))
}

/** Geschätztes Maximalgewicht (Epley) */
export const estimate1RM = (weightKg: number, reps: number) => (reps <= 1 ? weightKg : weightKg * (1 + reps / 30))

/** Klimmzüge mit Zusatzgewicht in „Wiederholungen mit Körpergewicht“ umrechnen. */
export const pullupEquivalentReps = (reps: number, addedKg: number, bodyKg: number) =>
  addedKg <= 0 ? reps : Math.max(reps, ((bodyKg + addedKg) / bodyKg) * (1 + reps / 30) * 30 - 30)

/** Trainingspause: Bestwerte älter als 8 Wochen verlieren 1 % pro Woche (höchstens bis 60 %). */
export function detrainingFactor(ageDays: number): number {
  const weeks = Math.max(0, ageDays - 56) / 7
  return Math.max(0.6, 1 - 0.01 * weeks)
}

export interface LiftEntry {
  ageDays: number
  weightKg: number
  reps: number
}

/** Level einer Übung aus allen Einträgen (bester Wert, abgewertet nach Alter). */
export function liftLevel(standard: LiftStandardKey, sex: SexKey, bodyKg: number, entries: readonly LiftEntry[]): number {
  if (bodyKg <= 0 || entries.length === 0) return 0
  const thresholds = STRENGTH_STANDARDS[standard][sex]
  let best = 0
  for (const e of entries) {
    const value =
      standard === 'pullup'
        ? pullupEquivalentReps(e.reps, e.weightKg, bodyKg)
        : estimate1RM(e.weightKg, e.reps) / bodyKg
    best = Math.max(best, thresholdLevel(value * detrainingFactor(e.ageDays), thresholds))
  }
  return best
}

/** 5-km-Zeit (Sekunden) → Level; Männer-Skala, Frauen ×1,12 */
const RUN_POINTS: [number, number][] = [
  [3600, 40],
  [2400, 100],
  [1800, 300],
  [1500, 450],
  [1320, 600],
  [1200, 700],
  [1080, 800],
  [960, 880],
  [840, 950],
  [755, 999],
]

/** Riegel-Formel: Zeit auf andere Distanz umrechnen */
export const fiveKEquivalent = (seconds: number, distanceKm: number) => seconds * Math.pow(5 / distanceKm, 1.06)

export function runLevel(fiveKSeconds: number, sex: SexKey): number {
  const t = sex === 'f' ? fiveKSeconds / 1.12 : fiveKSeconds
  if (t >= RUN_POINTS[0][0]) return (RUN_POINTS[0][1] * RUN_POINTS[0][0]) / t
  for (let i = 0; i < RUN_POINTS.length - 1; i++) {
    const [t1, l1] = RUN_POINTS[i]
    const [t2, l2] = RUN_POINTS[i + 1]
    if (t > t2) return l1 + ((t1 - t) / (t1 - t2)) * (l2 - l1)
  }
  return RUN_POINTS[RUN_POINTS.length - 1][1]
}

/** Sport = 60 % Leistung (Durchschnitt aller bewerteten Übungen/Läufe) + 40 % Trainingskonstanz. */
export function sportLevel(performanceLevels: readonly number[], consistency: number): { level: number; performance: number } {
  const performance = performanceLevels.length ? performanceLevels.reduce((a, b) => a + b, 0) / performanceLevels.length : 0
  return { level: clamp(0.6 * performance + 0.4 * consistency), performance }
}

/* ---------- Gesundheit ---------- */

export const bmi = (weightKg: number, heightCm: number) => weightKg / Math.pow(heightCm / 100, 2)

/** 1 im Normalbereich (18,5–24,9), linear abnehmend bis 0 bei 15 bzw. 35 */
export function bmiScore(value: number): number {
  if (value >= 18.5 && value < 25) return 1
  if (value < 18.5) return Math.max(0, (value - 15) / 3.5)
  return Math.max(0, 1 - (value - 25) / 10)
}

/** Körperfett im Idealbereich (Männer 10–18 %, Frauen 18–26 %) → 1, sonst abnehmend */
export function bodyFatScore(pct: number, sex: SexKey): number {
  const [lo, hi] = sex === 'f' ? [18, 26] : [10, 18]
  if (pct >= lo && pct <= hi) return 1
  const dist = pct < lo ? lo - pct : pct - hi
  return Math.max(0, 1 - dist / 12)
}

/** Gesundheit = 70 % Routinen (Disziplin) + 30 % Körperwerte; ohne Körperdaten nur Routinen. */
export function healthLevel(habitDiscipline: number, bodyScore: number | null): number {
  if (bodyScore == null) return clamp(habitDiscipline)
  return clamp(0.7 * habitDiscipline + 0.3 * MAX_LEVEL * bodyScore)
}

/* ---------- Lesen ---------- */

export type Difficulty = 'easy' | 'medium' | 'hard'
export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = { easy: 1, medium: 1.5, hard: 2.5 }
/** Höchstes erreichbares Level, wenn man nur diese Schwierigkeit liest */
export const DIFFICULTY_CAP: Record<Difficulty, number> = { easy: 500, medium: 800, hard: MAX_LEVEL }
export const READING_K = 30_000

/**
 * Lesen = Obergrenze (nach Schwierigkeits-Mix) × (70 % Lesevolumen + 30 % Wochenziel-Disziplin).
 * Volumen: gewichtete Minuten, flacht ab (1 h/Tag schwere Bücher ein Jahr lang ≈ 840 Volumen).
 */
export function readingLevel(
  minutesByDifficulty: Record<Difficulty, number>,
  weeklyDiscipline: number,
): { level: number; cap: number; volume: number } {
  const total = minutesByDifficulty.easy + minutesByDifficulty.medium + minutesByDifficulty.hard
  if (total <= 0) return { level: 0, cap: DIFFICULTY_CAP.easy, volume: 0 }
  const weighted = (Object.keys(minutesByDifficulty) as Difficulty[]).reduce(
    (a, d) => a + minutesByDifficulty[d] * DIFFICULTY_WEIGHT[d],
    0,
  )
  const cap = (Object.keys(minutesByDifficulty) as Difficulty[]).reduce((a, d) => a + minutesByDifficulty[d] * DIFFICULTY_CAP[d], 0) / total
  const volume = 1 - Math.exp(-weighted / READING_K)
  return { level: clamp(cap * (0.7 * volume + 0.3 * (weeklyDiscipline / MAX_LEVEL))), cap, volume }
}

/* ---------- Musik ---------- */

export interface Milestone {
  level: number
  title: string
  detail: string
}

/** Meilenstein-Leiter Klavier – vom Notenlernen bis zur internationalen Konzertkarriere */
export const PIANO_MILESTONES: Milestone[] = [
  { level: 0, title: 'Einstieg', detail: 'Noten lernen, erste Töne' },
  { level: 40, title: 'Noten lesen', detail: 'Violin- und Bassschlüssel, einfache Melodien einhändig' },
  { level: 100, title: 'Beidhändig', detail: 'Erste beidhändige Stücke aus der Klavierschule' },
  { level: 180, title: 'Leichte Stücke', detail: 'Flüssig, mit Tonleitern (≈ ABRSM Grade 1–2)' },
  { level: 280, title: 'Mittelstufe I', detail: 'Leichte Sonatinen (≈ Grade 3–4)' },
  { level: 380, title: 'Mittelstufe II', detail: '≈ Grade 5' },
  { level: 480, title: 'Fortgeschritten', detail: 'Bach-Inventionen, leichte Chopin-Walzer (≈ Grade 6–7)' },
  { level: 580, title: 'Oberstufe', detail: '≈ Grade 8' },
  { level: 700, title: 'Aufnahmeprüfung', detail: 'Niveau Aufnahmeprüfung Musikhochschule' },
  { level: 800, title: 'Musikstudium', detail: 'Abschluss Bachelor/Master Klavier' },
  { level: 900, title: 'Profi', detail: 'Professioneller Pianist, Orchester, Wettbewerbe' },
  { level: 980, title: 'Weltklasse', detail: 'Internationale Konzertkarriere' },
]

/**
 * Musik = mindestens der erreichte Meilenstein; Übungsstunden heben das Level innerhalb der Stufe,
 * aber nie über den nächsten Meilenstein (den bestätigst du selbst).
 */
export function musicLevel(milestoneIndex: number, practiceHours: number, ladder: readonly Milestone[] = PIANO_MILESTONES): number {
  const i = Math.max(0, Math.min(ladder.length - 1, milestoneIndex))
  const base = ladder[i].level
  const next = i + 1 < ladder.length ? ladder[i + 1].level : MAX_LEVEL
  const practice = MAX_LEVEL * (1 - Math.exp(-practiceHours / 3500))
  return clamp(Math.min(next - 1, Math.max(base, practice)))
}

/* ---------- Projekt ---------- */

export type MilestoneSizeKey = 'small' | 'medium' | 'large'
export const MILESTONE_POINTS: Record<MilestoneSizeKey, number> = { small: 1, medium: 3, large: 8 }

/** Projekt = 40 % Erfahrung (Stunden) + 35 % erreichte Meilensteine + 25 % Konstanz (Wochen mit Projektzeit). */
export function projectLevel(hours: number, milestonePoints: number, weeklyDiscipline: number): number {
  const experience = 1 - Math.exp(-hours / 3500)
  const achievements = 1 - Math.exp(-milestonePoints / 150)
  return clamp(MAX_LEVEL * (0.4 * experience + 0.35 * achievements) + 0.25 * weeklyDiscipline)
}

/* ---------- Charakter ---------- */

export function characterLevel(skillLevels: readonly number[]): number {
  if (skillLevels.length === 0) return 0
  return clamp(skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length)
}
