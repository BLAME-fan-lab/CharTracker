import type { DateStr } from '../lib/dates'

/** Versionierter Wert: gilt ab `validFrom` (Montag) bis zum nächsten Eintrag. */
export interface Versioned {
  validFrom: DateStr
}

/**
 * Der für eine Woche gültige Eintrag: der letzte mit validFrom ≤ Montag.
 * Liegt die Woche vor allen Einträgen, gilt der früheste (so haben auch alte Wochen ein Soll).
 */
export function versionForWeek<T extends Versioned>(items: readonly T[], monday: DateStr): T | undefined {
  if (items.length === 0) return undefined
  const sorted = [...items].sort((a, b) => a.validFrom.localeCompare(b.validFrom))
  let result = sorted[0]
  for (const item of sorted) {
    if (item.validFrom <= monday) result = item
    else break
  }
  return result
}

export interface TrainingTarget {
  typeId: string
  count: number
}

export interface TrainingTypeProgress {
  typeId: string
  target: number
  done: number
  /** Einheiten über dem Soll dieses Typs */
  extra: number
}

export interface TrainingProgress {
  perType: TrainingTypeProgress[]
  /** Erfüllte Soll-Einheiten (pro Typ gedeckelt) */
  done: number
  target: number
  /** Alle Einheiten über dem Soll, inkl. Typen ohne Soll */
  extra: number
  /** Alle eingetragenen Einheiten */
  total: number
}

/**
 * Training gilt pro Typ: Ein drittes Gym ersetzt kein fehlendes Workout,
 * sondern zählt als Extra-Einheit („+1“).
 */
export function trainingProgress(
  targets: readonly TrainingTarget[],
  sessions: readonly { typeId: string }[],
): TrainingProgress {
  const counts = new Map<string, number>()
  for (const s of sessions) counts.set(s.typeId, (counts.get(s.typeId) ?? 0) + 1)

  const perType: TrainingTypeProgress[] = targets
    .filter((t) => t.count > 0)
    .map((t) => {
      const done = counts.get(t.typeId) ?? 0
      return { typeId: t.typeId, target: t.count, done, extra: Math.max(0, done - t.count) }
    })

  const plannedTypes = new Set(perType.map((p) => p.typeId))
  let unplanned = 0
  for (const [typeId, n] of counts) if (!plannedTypes.has(typeId)) unplanned += n

  return {
    perType,
    done: perType.reduce((sum, p) => sum + Math.min(p.done, p.target), 0),
    target: perType.reduce((sum, p) => sum + p.target, 0),
    extra: perType.reduce((sum, p) => sum + p.extra, 0) + unplanned,
    total: sessions.length,
  }
}

/** Summe der Minuten, optional gefiltert. */
export const sumMinutes = <T extends { minutes: number }>(items: readonly T[], filter?: (item: T) => boolean): number =>
  items.reduce((sum, item) => (filter && !filter(item) ? sum : sum + item.minutes), 0)

/** Anteil Ist/Soll, 0–1 (Soll 0 → 1, wenn nichts verlangt ist). */
export const ratio = (actual: number, target: number): number => (target <= 0 ? 1 : Math.min(1, actual / target))
