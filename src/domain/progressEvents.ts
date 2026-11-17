import { rankFor, type Rank } from './ranks'

export interface LevelSnapshot {
  character: number
  skills: Record<string, number>
}

export type ProgressEvent =
  | { kind: 'rank-up'; skill: string | null; rank: Rank; level: number }
  | { kind: 'achievement'; id: string }
  | { kind: 'level-up'; from: number; to: number }

/** Werte auf eine Nachkommastelle, damit Rundungsrauschen keine Ereignisse auslöst */
export const snapshot = (character: number, skills: Record<string, number>): LevelSnapshot => ({
  character: Math.round(character * 10) / 10,
  skills: Object.fromEntries(Object.entries(skills).map(([k, v]) => [k, Math.round(v * 10) / 10])),
})

export const sameSnapshot = (a: LevelSnapshot, b: LevelSnapshot) =>
  a.character === b.character &&
  Object.keys({ ...a.skills, ...b.skills }).every((k) => a.skills[k] === b.skills[k])

/**
 * Was ist seit dem letzten Schnappschuss neu?
 * - Rang-Aufstieg (Charakter oder Baum überschreitet eine 100er-Grenze)
 * - neue Errungenschaften
 * - Charakterlevel um mindestens 1 gestiegen (kleiner Hinweis)
 * Ohne vorherigen Schnappschuss (erster Start) gibt es keine Ereignisse.
 */
export function detectProgress(
  prev: LevelSnapshot | null,
  next: LevelSnapshot,
  unlockedIds: readonly string[],
  knownIds: readonly string[],
): ProgressEvent[] {
  if (!prev) return []
  const events: ProgressEvent[] = []
  if (rankFor(next.character).index > rankFor(prev.character).index) {
    events.push({ kind: 'rank-up', skill: null, rank: rankFor(next.character), level: next.character })
  }
  for (const [skill, level] of Object.entries(next.skills)) {
    const before = prev.skills[skill]
    if (before != null && rankFor(level).index > rankFor(before).index) {
      events.push({ kind: 'rank-up', skill, rank: rankFor(level), level })
    }
  }
  const known = new Set(knownIds)
  for (const id of unlockedIds) if (!known.has(id)) events.push({ kind: 'achievement', id })
  if (Math.floor(next.character) > Math.floor(prev.character)) {
    events.push({ kind: 'level-up', from: Math.floor(prev.character), to: Math.floor(next.character) })
  }
  return events
}

/** Große Feier (Overlay) nur bei Rang-Aufstieg oder Errungenschaft, sonst kleiner Hinweis */
export const isBigEvent = (e: ProgressEvent) => e.kind !== 'level-up'
