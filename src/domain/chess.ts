/*
 * Schach-Baum: realistische Skala über die Wertungszahl.
 * Anfänger ~400–800, Vereinsspieler ~1600, Experte ~2000, Meister ~2200–2400,
 * Weltspitze (Blitz auf chess.com) über 3000 → nähert sich 1000, ohne sie zu erreichen.
 */

import { addDaysStr, diffDays, toDateStr, type DateStr } from '../lib/dates'

export interface ChessValues {
  rapid: number | null
  blitz: number | null
  bullet: number | null
  daily: number | null
  puzzle: number | null
  games: number
  lastPlayed: DateStr | null
}

/** Wertung → Level (Stützstellen, dazwischen linear) */
export const CHESS_POINTS: [number, number][] = [
  [0, 0],
  [400, 40],
  [600, 110],
  [800, 200],
  [1000, 280],
  [1200, 360],
  [1400, 430],
  [1600, 500],
  [1800, 570],
  [2000, 640],
  [2200, 720],
  [2400, 800],
  [2600, 880],
  [2800, 950],
]

export function chessRatingLevel(rating: number): number {
  if (rating <= 0) return 0
  const last = CHESS_POINTS[CHESS_POINTS.length - 1]
  if (rating >= last[0]) return last[1] + 50 * (1 - Math.exp(-(rating - last[0]) / 300))
  for (let i = 1; i < CHESS_POINTS.length; i++) {
    const [r1, l1] = CHESS_POINTS[i]
    if (rating <= r1) {
      const [r0, l0] = CHESS_POINTS[i - 1]
      return l0 + ((rating - r0) / (r1 - r0)) * (l1 - l0)
    }
  }
  return last[1]
}

/** Maßgebliche Wertung: beste aus Rapid, Blitz, Daily (Bullet zählt nicht); ohne Partien 75 % der Puzzle-Wertung */
export function effectiveRating(v: ChessValues): { rating: number; from: string } {
  const games: [string, number | null][] = [
    ['Rapid', v.rapid],
    ['Blitz', v.blitz],
    ['Daily', v.daily],
  ]
  const best = games.filter((g): g is [string, number] => g[1] != null && g[1] > 0).sort((a, b) => b[1] - a[1])[0]
  if (best) return { rating: best[1], from: best[0] }
  if (v.puzzle) return { rating: Math.round(v.puzzle * 0.75), from: 'Puzzles' }
  return { rating: 0, from: '–' }
}

/** Erfahrung: viele Partien heben bis zu 15 % */
export const chessExperience = (games: number) => 0.85 + 0.15 * (1 - Math.exp(-Math.max(0, games) / 1500))

/** Wer länger als 8 Wochen nicht spielt, verliert 1 % pro Woche (höchstens 20 %) */
export function chessActivity(lastPlayed: DateStr | null, today: DateStr): number {
  if (!lastPlayed) return 1
  const weeks = diffDays(today, lastPlayed) / 7
  return weeks <= 8 ? 1 : Math.max(0.8, 1 - 0.01 * (weeks - 8))
}

export function chessLevel(v: ChessValues | null, today: DateStr): number {
  if (!v) return 0
  const { rating } = effectiveRating(v)
  return Math.max(0, Math.min(1000, chessRatingLevel(rating) * chessExperience(v.games) * chessActivity(v.lastPlayed, today)))
}

/* ---------- chess.com ---------- */

interface ChessComMode {
  last?: { rating?: number; date?: number }
  record?: { win?: number; loss?: number; draw?: number }
}

/** Antwort von https://api.chess.com/pub/player/{name}/stats in Werte umwandeln */
export function parseChessComStats(json: unknown): ChessValues {
  const d = (json ?? {}) as Record<string, unknown>
  const mode = (k: string) => (d[k] ?? {}) as ChessComMode
  const rating = (k: string) => {
    const r = mode(k).last?.rating
    return typeof r === 'number' && r > 0 ? r : null
  }
  const keys = ['chess_rapid', 'chess_blitz', 'chess_bullet', 'chess_daily']
  const games = keys.reduce((sum, k) => {
    const rec = mode(k).record ?? {}
    return sum + (rec.win ?? 0) + (rec.loss ?? 0) + (rec.draw ?? 0)
  }, 0)
  const lastTs = Math.max(0, ...keys.map((k) => mode(k).last?.date ?? 0))
  const tactics = (d.tactics ?? {}) as { highest?: { rating?: number } }
  return {
    rapid: rating('chess_rapid'),
    blitz: rating('chess_blitz'),
    bullet: rating('chess_bullet'),
    daily: rating('chess_daily'),
    puzzle: typeof tactics.highest?.rating === 'number' ? tactics.highest.rating : null,
    games,
    lastPlayed: lastTs > 0 ? toDateStr(new Date(lastTs * 1000)) : null,
  }
}

/** Gültiger chess.com-Benutzername (Buchstaben, Ziffern, _ und -) */
export const isChessUsername = (name: string) => /^[A-Za-z0-9_-]{3,25}$/.test(name.trim())

export const chessComProfileUrl = (name: string) => `https://www.chess.com/member/${encodeURIComponent(name.trim())}`

/** Tag, ab dem ein neuer Abruf fällig ist (einmal pro Tag) */
export const nextChessSync = (lastDate: DateStr | null) => (lastDate ? addDaysStr(lastDate, 1) : null)
