import type {
  Book,
  BodyLog,
  Exercise,
  GoalTarget,
  Habit,
  HabitLog,
  HabitSkill,
  LiftLog,
  Module,
  MusicLog,
  PastGrade,
  Profile,
  ProjectLog,
  ProjectMilestone,
  ReadingLog,
  RunLog,
  TrainingPlan,
  TrainingSession,
} from '../data/types'
import { addDaysStr, daysInRange, diffDays, weekStartOf, type DateStr } from '../lib/dates'
import {
  academicLevel,
  bmi,
  bmiScore,
  bodyFatScore,
  characterLevel,
  DAILY_DOWN,
  DAILY_UP,
  detrainingFactor,
  disciplineLevel,
  fiveKEquivalent,
  healthLevel,
  liftLevel,
  MILESTONE_POINTS,
  musicLevel,
  projectLevel,
  readingLevel,
  runLevel,
  sportLevel,
  WEEKLY_DOWN,
  WEEKLY_UP,
  type Difficulty,
  type SexKey,
} from './character'
import { DoneIndex, isHabitActiveOn } from './habits'
import { trainingProgress, versionForWeek } from './weekly'

export type SkillKey = 'academic' | 'sport' | 'health' | 'hygiene' | 'reading' | 'music' | 'project'

export const SKILL_NAMES: Record<SkillKey, string> = {
  academic: 'Akademisch',
  sport: 'Sportlich',
  health: 'Gesundheit',
  hygiene: 'Hygiene & Pflege',
  reading: 'Lesen',
  music: 'Musikalisch',
  project: 'Projekt',
}

export const SKILL_ORDER: SkillKey[] = ['academic', 'sport', 'health', 'hygiene', 'reading', 'music', 'project']

export interface SkillDetail {
  label: string
  value: string
}

export interface SkillResult {
  key: SkillKey
  level: number
  details: SkillDetail[]
  /** Was fehlt, damit der Baum aussagekräftig wird */
  hint: string | null
}

export interface CharacterInput {
  today: DateStr
  trackingStart: DateStr
  habits: Habit[]
  habitLogs: HabitLog[]
  trainingPlans: TrainingPlan[]
  trainingSessions: TrainingSession[]
  goalTargets: GoalTarget[]
  readingLogs: ReadingLog[]
  books: Book[]
  modules: Module[]
  pastGrades: PastGrade[]
  profile: Profile | undefined
  bodyLogs: BodyLog[]
  exercises: Exercise[]
  liftLogs: LiftLog[]
  runLogs: RunLog[]
  musicLogs: MusicLog[]
  projectLogs: ProjectLog[]
  projectMilestones: ProjectMilestone[]
}

export interface CharacterSheet {
  level: number
  skills: SkillResult[]
  age: number | null
  weightKg: number | null
  bmi: number | null
}

/* ---------- Zuordnung der Gewohnheiten ---------- */

const HYGIENE_RE = /zähne|zahn|dusch|aufräum|müll|pflege|haut|rasier|wäsche|putz|bad/i
const HEALTH_RE = /schlaf|aufgestanden|aufsteh|wasser|trink|vitamin|meditat|spazier|gesund|ernähr|dehn/i

export function habitSkill(h: Pick<Habit, 'name' | 'skill'>): HabitSkill {
  if (h.skill) return h.skill
  if (HYGIENE_RE.test(h.name)) return 'hygiene'
  if (HEALTH_RE.test(h.name)) return 'health'
  return 'none'
}

/** Erfüllungsgrad pro Tag (null = keine Gewohnheit geplant). Heute zählt nur, wenn schon alles erledigt ist. */
export function dailyAdherence(habits: Habit[], done: DoneIndex, from: DateStr, today: DateStr): (number | null)[] {
  return daysInRange(from, today).map((d) => {
    const active = habits.filter((h) => isHabitActiveOn(h, d))
    if (active.length === 0) return null
    const ratio = active.filter((h) => done.has(h.id, d)).length / active.length
    if (d === today) return ratio === 1 ? 1 : null
    return ratio
  })
}

/** Wochen (Montage) von from bis heute */
function weeks(from: DateStr, today: DateStr): DateStr[] {
  const result: DateStr[] = []
  for (let m = weekStartOf(from); m <= today; m = addDaysStr(m, 7)) result.push(m)
  return result
}

/** Wochen-Erfüllung; die laufende Woche zählt nur, wenn sie schon erfüllt ist. */
function weeklySeries(from: DateStr, today: DateStr, adherence: (monday: DateStr) => number | null): (number | null)[] {
  const current = weekStartOf(today)
  return weeks(from, today).map((m) => {
    const a = adherence(m)
    if (m === current) return a != null && a >= 1 ? 1 : null
    return a
  })
}

const sumBy = <T>(items: readonly T[], f: (t: T) => number) => items.reduce((a, t) => a + f(t), 0)
const inWeek = (date: DateStr, monday: DateStr) => date >= monday && date <= addDaysStr(monday, 6)
const fmt1 = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 })
const latest = <T extends { date: DateStr }>(items: readonly T[], has: (t: T) => boolean) =>
  [...items].filter(has).sort((a, b) => b.date.localeCompare(a.date))[0]

/* ---------- Berechnung ---------- */

export function computeCharacter(input: CharacterInput): CharacterSheet {
  const { today } = input
  const start = input.trackingStart <= today ? input.trackingStart : today
  const done = new DoneIndex(input.habitLogs)
  const sex: SexKey = input.profile?.sex ?? 'm'

  const lastWeight = latest(input.bodyLogs, (b) => b.weightKg != null)
  const lastFat = latest(input.bodyLogs, (b) => b.bodyFatPct != null)
  const weightKg = lastWeight?.weightKg ?? null
  const heightCm = input.profile?.heightCm ?? null
  const bmiValue = weightKg && heightCm ? bmi(weightKg, heightCm) : null
  const age = input.profile?.birthDate
    ? Math.floor(diffDays(today, input.profile.birthDate) / 365.2425)
    : null

  const skills: SkillResult[] = []

  /* Akademisch */
  {
    const grades = [
      ...input.pastGrades.map((g) => ({ grade: g.grade, ects: g.ects })),
      ...input.modules.filter((m) => m.grade != null).map((m) => ({ grade: m.grade!, ects: m.ects ?? 5 })),
    ]
    const r = academicLevel(grades)
    skills.push({
      key: 'academic',
      level: r.level,
      details: [
        { label: 'Notendurchschnitt', value: r.average == null ? '–' : fmt1(Math.round(r.average * 100) / 100) },
        { label: 'Bewertete Module', value: `${r.count} (${r.ects} ECTS)` },
      ],
      hint: r.count === 0 ? 'Trag deine bisherigen Noten ein (Charakter → Akademisch).' : null,
    })
  }

  /* Sport */
  {
    const perf: number[] = []
    const details: SkillDetail[] = []
    if (weightKg) {
      for (const ex of input.exercises.filter((e) => !e.archived && e.standard)) {
        const logs = input.liftLogs.filter((l) => l.exerciseId === ex.id && l.date <= today)
        if (logs.length === 0) continue
        const level = liftLevel(
          ex.standard!,
          sex,
          weightKg,
          logs.map((l) => ({ ageDays: diffDays(today, l.date), weightKg: l.weightKg, reps: l.reps })),
        )
        perf.push(level)
        details.push({ label: ex.name, value: `${Math.floor(level)}` })
      }
    }
    const runs = input.runLogs.filter((r) => r.date <= today && r.distanceKm > 0)
    if (runs.length) {
      const best = Math.min(...runs.map((r) => fiveKEquivalent(r.seconds, r.distanceKm) / detrainingFactor(diffDays(today, r.date))))
      const level = runLevel(best, sex)
      perf.push(level)
      details.push({ label: 'Ausdauer (5 km)', value: `${Math.floor(level)}` })
    }
    const series = weeklySeries(start, today, (monday) => {
      const plan = versionForWeek(input.trainingPlans, monday)
      const sessions = input.trainingSessions.filter((s) => inWeek(s.date, monday))
      const p = trainingProgress(plan?.targets ?? [], sessions)
      return p.target > 0 ? p.done / p.target : null
    })
    const consistency = disciplineLevel(series, WEEKLY_UP, WEEKLY_DOWN)
    const r = sportLevel(perf, consistency)
    skills.push({
      key: 'sport',
      level: r.level,
      details: [
        { label: 'Leistung', value: perf.length ? `${Math.floor(r.performance)}` : '–' },
        { label: 'Trainingskonstanz', value: `${Math.floor(consistency)}` },
        ...details,
      ],
      hint: !weightKg
        ? 'Trag dein Gewicht ein, dann zählen deine Kraftwerte.'
        : perf.length === 0
          ? 'Trag Bestwerte deiner Übungen ein (Charakter → Sportlich).'
          : null,
    })
  }

  /* Gesundheit & Hygiene (Routinen) */
  const habitsOf = (skill: HabitSkill) => input.habits.filter((h) => habitSkill(h) === skill)
  {
    const habits = habitsOf('health')
    const discipline = disciplineLevel(dailyAdherence(habits, done, start, today), DAILY_UP, DAILY_DOWN)
    const scores = [
      bmiValue != null ? bmiScore(bmiValue) : null,
      lastFat?.bodyFatPct != null ? bodyFatScore(lastFat.bodyFatPct, sex) : null,
    ].filter((s): s is number => s != null)
    const bodyScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    skills.push({
      key: 'health',
      level: healthLevel(discipline, bodyScore),
      details: [
        { label: 'Routinen', value: `${Math.floor(discipline)} (${habits.map((h) => h.name).join(', ') || 'keine'})` },
        { label: 'Körperwerte', value: bodyScore == null ? '–' : `${Math.round(bodyScore * 100)} %` },
        ...(bmiValue != null ? [{ label: 'BMI', value: fmt1(bmiValue) }] : []),
      ],
      hint: bodyScore == null ? 'Größe und Gewicht eintragen, dann zählen die Körperwerte mit.' : null,
    })
  }
  {
    const habits = habitsOf('hygiene')
    const discipline = disciplineLevel(dailyAdherence(habits, done, start, today), DAILY_UP, DAILY_DOWN)
    skills.push({
      key: 'hygiene',
      level: discipline,
      details: [{ label: 'Routinen', value: habits.map((h) => h.name).join(', ') || 'keine' }],
      hint: habits.length === 0 ? 'Ordne Gewohnheiten diesem Bereich zu (Einstellungen → Tägliche Ziele).' : null,
    })
  }

  /* Lesen */
  {
    const difficultyOf = (log: ReadingLog): Difficulty =>
      (log.bookId && input.books.find((b) => b.id === log.bookId)?.difficulty) || 'medium'
    const minutes: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 }
    for (const l of input.readingLogs) if (l.date <= today) minutes[difficultyOf(l)] += l.minutes
    const readingTargets = input.goalTargets.filter((t) => t.kind === 'reading')
    const series = weeklySeries(start, today, (monday) => {
      const target = versionForWeek(readingTargets, monday)?.minutes ?? 0
      if (target <= 0) return null
      return sumBy(input.readingLogs.filter((l) => inWeek(l.date, monday)), (l) => l.minutes) / target
    })
    const discipline = disciplineLevel(series, WEEKLY_UP, WEEKLY_DOWN)
    const r = readingLevel(minutes, discipline)
    const total = minutes.easy + minutes.medium + minutes.hard
    skills.push({
      key: 'reading',
      level: r.level,
      details: [
        { label: 'Gelesen', value: `${fmt1(total / 60)} h (leicht ${fmt1(minutes.easy / 60)}, mittel ${fmt1(minutes.medium / 60)}, schwer ${fmt1(minutes.hard / 60)})` },
        { label: 'Obergrenze nach Schwierigkeit', value: `${Math.floor(r.cap)}` },
        { label: 'Wochenziel-Disziplin', value: `${Math.floor(discipline)}` },
      ],
      hint: input.books.length === 0 ? 'Leg deine Bücher mit Schwierigkeit an (Charakter → Lesen).' : null,
    })
  }

  /* Musik */
  {
    const hours = sumBy(input.musicLogs.filter((l) => l.date <= today), (l) => l.minutes) / 60
    const milestone = input.profile?.musicMilestone ?? 0
    skills.push({
      key: 'music',
      level: musicLevel(milestone, hours),
      details: [
        { label: 'Instrument', value: input.profile?.instrument ?? 'Klavier' },
        { label: 'Übungszeit gesamt', value: `${fmt1(hours)} h` },
      ],
      hint: hours === 0 ? 'Trag deine Übungszeit im Tages-Panel ein.' : null,
    })
  }

  /* Projekt */
  {
    const hours = sumBy(input.projectLogs.filter((l) => l.date <= today), (l) => l.minutes) / 60
    const points = sumBy(input.projectMilestones.filter((m) => m.doneDate), (m) => MILESTONE_POINTS[m.size])
    const series = weeklySeries(start, today, (monday) =>
      Math.min(1, sumBy(input.projectLogs.filter((l) => inWeek(l.date, monday)), (l) => l.minutes) / 180),
    )
    const discipline = disciplineLevel(series, WEEKLY_UP, WEEKLY_DOWN)
    skills.push({
      key: 'project',
      level: projectLevel(hours, points, discipline),
      details: [
        { label: 'Projektzeit gesamt', value: `${fmt1(hours)} h` },
        { label: 'Meilensteine', value: `${input.projectMilestones.filter((m) => m.doneDate).length} erreicht (${points} Punkte)` },
        { label: 'Konstanz', value: `${Math.floor(discipline)}` },
      ],
      hint: input.projectMilestones.length === 0 ? 'Leg Meilensteine für dein Projekt an (Charakter → Projekt).' : null,
    })
  }

  return {
    level: characterLevel(skills.map((s) => s.level)),
    skills,
    age,
    weightKg,
    bmi: bmiValue,
  }
}
