/** Ränge je 100 Level – für den Charakter und jeden Skill-Baum. */

export interface Rank {
  index: number
  name: string
  min: number
  /** Tailwind-Klassen für Text und Hintergrund/Ring der Rang-Plakette */
  tone: string
  /** Hex-Farbe für Grafiken (SVG) */
  color: string
}

export const RANKS: Rank[] = [
  { index: 0, name: 'Novize', min: 0, tone: 'text-zinc-300 bg-zinc-800 ring-zinc-600', color: '#a1a1aa' },
  { index: 1, name: 'Lehrling', min: 100, tone: 'text-orange-200 bg-orange-900/40 ring-orange-700/60', color: '#c2410c' },
  { index: 2, name: 'Geselle', min: 200, tone: 'text-amber-200 bg-amber-900/40 ring-amber-700/60', color: '#b45309' },
  { index: 3, name: 'Fortgeschrittener', min: 300, tone: 'text-slate-100 bg-slate-700/50 ring-slate-400/60', color: '#94a3b8' },
  { index: 4, name: 'Könner', min: 400, tone: 'text-slate-50 bg-slate-600/50 ring-slate-300/70', color: '#cbd5e1' },
  { index: 5, name: 'Experte', min: 500, tone: 'text-yellow-200 bg-yellow-900/40 ring-yellow-500/60', color: '#eab308' },
  { index: 6, name: 'Meister', min: 600, tone: 'text-amber-100 bg-amber-700/40 ring-amber-300/70', color: '#fbbf24' },
  { index: 7, name: 'Großmeister', min: 700, tone: 'text-cyan-100 bg-cyan-900/40 ring-cyan-300/70', color: '#67e8f9' },
  { index: 8, name: 'Elite', min: 800, tone: 'text-sky-100 bg-sky-800/50 ring-sky-300/80', color: '#7dd3fc' },
  { index: 9, name: 'Legende', min: 900, tone: 'text-fuchsia-100 bg-fuchsia-900/50 ring-fuchsia-300/80', color: '#f0abfc' },
]

export function rankFor(level: number): Rank {
  const l = Math.max(0, Math.floor(level))
  return RANKS[Math.min(RANKS.length - 1, Math.floor(l / 100))]
}

/** Nächster Rang und wie viele Level noch fehlen (null auf dem höchsten Rang). */
export function nextRank(level: number): { rank: Rank; missing: number } | null {
  const current = rankFor(level)
  const next = RANKS[current.index + 1]
  if (!next) return null
  return { rank: next, missing: Math.max(1, Math.ceil(next.min - level)) }
}
