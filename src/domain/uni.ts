import { addDaysStr, diffDays, type DateStr } from '../lib/dates'

/*
 * Uni-Fortschritt: Soll/Ist pro Modul.
 *
 * Ist  = erledigte Einheiten / alle Einheiten
 * Soll = linear vom Soll-Start (Vorlesungsbeginn) bis zum Zieldatum auf 100 %.
 *        Zieldatum = früheres Datum von (Klausur − Puffer) und „alles fertig bis“ des Semesters;
 *        ohne Klausurtermin gilt „alles fertig bis“.
 * Optional steht das Soll in Semesterpausen (z. B. Weihnachten) still.
 */

export interface Period {
  start: DateStr
  end: DateStr
}

export interface UniConfig {
  /** Ab hier steigt das Soll (Vorlesungsbeginn) */
  sollStart: DateStr
  /** „Alles fertig bis“ des Semesters */
  semesterTarget: DateStr
  bufferDays: number
  /** ± Prozentpunkte für „im Plan“ */
  tolerancePp: number
  breaks: Period[]
  pauseInBreaks: boolean
}

export type ModuleStatus = 'ahead' | 'on_track' | 'behind' | 'no_units' | 'done'

export const STATUS_LABEL: Record<ModuleStatus, string> = {
  ahead: 'voraus',
  on_track: 'im Plan',
  behind: 'hinterher',
  no_units: 'keine Einheiten',
  done: 'fertig',
}

/** Zieldatum, an dem das Soll 100 % erreicht. */
export function sollTargetDate(examDate: DateStr | null, cfg: Pick<UniConfig, 'bufferDays' | 'semesterTarget'>): DateStr {
  if (!examDate) return cfg.semesterTarget
  const beforeExam = addDaysStr(examDate, -cfg.bufferDays)
  return beforeExam < cfg.semesterTarget ? beforeExam : cfg.semesterTarget
}

/** Anzahl Pausentage d mit from ≤ d < to. */
export function breakDaysBetween(from: DateStr, to: DateStr, breaks: readonly Period[]): number {
  let count = 0
  for (const b of breaks) {
    const s = b.start > from ? b.start : from
    const endExclusive = addDaysStr(b.end, 1)
    const e = endExclusive < to ? endExclusive : to
    const n = diffDays(e, s)
    if (n > 0) count += n
  }
  return count
}

/** Zählbare Tage von from bis to (to exklusiv), ggf. ohne Pausentage. */
export function effectiveDays(from: DateStr, to: DateStr, cfg: Pick<UniConfig, 'breaks' | 'pauseInBreaks'>): number {
  const raw = diffDays(to, from)
  if (raw <= 0) return 0
  return cfg.pauseInBreaks ? raw - breakDaysBetween(from, to, cfg.breaks) : raw
}

/** Soll-Fortschritt (0–1) an einem Tag. */
export function sollAt(today: DateStr, target: DateStr, cfg: UniConfig): number {
  if (today >= target) return 1
  if (today <= cfg.sollStart) return 0
  const total = effectiveDays(cfg.sollStart, target, cfg)
  if (total <= 0) return 1
  return Math.min(1, effectiveDays(cfg.sollStart, today, cfg) / total)
}

export interface UnitLike {
  doneDate: DateStr | null
}

export interface ModuleProgress {
  total: number
  done: number
  open: number
  /** 0–1, null ohne Einheiten */
  ist: number | null
  /** 0–1 */
  soll: number
  /** (Ist − Soll) in Prozentpunkten, null ohne Einheiten */
  deviationPp: number | null
  status: ModuleStatus
  targetDate: DateStr
  examDate: DateStr | null
  /** Tage bis zur Klausur (negativ = vorbei), null ohne Termin */
  daysToExam: number | null
  /** Zählbare Tage bis zur nächsten Frist (Zieldatum, danach Klausur) */
  daysRemaining: number
  /** nötige Einheiten pro Woche, um bis zur Frist fertig zu werden; null wenn nichts offen oder keine Zeit mehr */
  unitsPerWeek: number | null
  examPassed: boolean
}

export function moduleProgress(
  module: { examDate: DateStr | null },
  units: readonly UnitLike[],
  today: DateStr,
  cfg: UniConfig,
): ModuleProgress {
  const total = units.length
  const done = units.filter((u) => u.doneDate != null).length
  const open = total - done
  const targetDate = sollTargetDate(module.examDate, cfg)
  const soll = sollAt(today, targetDate, cfg)
  const ist = total === 0 ? null : done / total
  const deviationPp = ist == null ? null : Math.round((ist - soll) * 1000) / 10

  let status: ModuleStatus
  if (total === 0) status = 'no_units'
  else if (open === 0) status = 'done'
  else if (deviationPp! > cfg.tolerancePp) status = 'ahead'
  else if (deviationPp! < -cfg.tolerancePp) status = 'behind'
  else status = 'on_track'

  const examPassed = module.examDate != null && today > module.examDate
  const deadline = today < targetDate ? targetDate : module.examDate && today < module.examDate ? module.examDate : null
  const daysRemaining = deadline ? effectiveDays(today, deadline, cfg) : 0
  const unitsPerWeek = open > 0 && daysRemaining > 0 ? (open / daysRemaining) * 7 : null

  return {
    total,
    done,
    open,
    ist,
    soll,
    deviationPp,
    status,
    targetDate,
    examDate: module.examDate,
    daysToExam: module.examDate ? diffDays(module.examDate, today) : null,
    daysRemaining,
    unitsPerWeek,
    examPassed,
  }
}

export type UniSort = 'backlog' | 'exam'

const statusRank = (p: ModuleProgress) => (p.examPassed ? 3 : p.status === 'done' ? 2 : p.status === 'no_units' ? 1 : 0)

/**
 * Dringlichkeit:
 * - backlog: größter Rückstand (Ist − Soll) zuerst
 * - exam: nächste Klausur zuerst (ohne Termin nach Zieldatum, danach)
 * Module ohne Einheiten, fertige und solche mit vergangener Klausur stehen am Ende.
 */
export function sortModules<T extends { progress: ModuleProgress; order: number }>(items: readonly T[], mode: UniSort): T[] {
  return [...items].sort((a, b) => {
    const r = statusRank(a.progress) - statusRank(b.progress)
    if (r !== 0) return r
    const devA = a.progress.deviationPp ?? 0
    const devB = b.progress.deviationPp ?? 0
    if (mode === 'backlog') {
      if (devA !== devB) return devA - devB
      return a.progress.targetDate.localeCompare(b.progress.targetDate) || a.order - b.order
    }
    const ea = a.progress.examDate ?? '9999-12-31'
    const eb = b.progress.examDate ?? '9999-12-31'
    if (ea !== eb) return ea.localeCompare(eb)
    return a.progress.targetDate.localeCompare(b.progress.targetDate) || devA - devB || a.order - b.order
  })
}

/** Gesamtfortschritt über alle Module (gewichtet nach Anzahl Einheiten). */
export function overallProgress(progresses: readonly ModuleProgress[]): { ist: number | null; soll: number | null; total: number; done: number } {
  const withUnits = progresses.filter((p) => p.total > 0)
  const total = withUnits.reduce((a, p) => a + p.total, 0)
  const done = withUnits.reduce((a, p) => a + p.done, 0)
  if (total === 0) return { ist: null, soll: null, total: 0, done: 0 }
  const soll = withUnits.reduce((a, p) => a + p.soll * p.total, 0) / total
  return { ist: done / total, soll, total, done }
}
