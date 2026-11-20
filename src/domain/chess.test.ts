import { describe, expect, it } from 'vitest'
import { chessActivity, chessExperience, chessLevel, chessRatingLevel, effectiveRating, isChessUsername, parseChessComStats } from './chess'

// Ausschnitt im Format von api.chess.com/pub/player/{name}/stats
const sample = {
  chess_rapid: { last: { rating: 1043, date: 1795000000, rd: 60 }, best: { rating: 1100, date: 1790000000 }, record: { win: 120, loss: 100, draw: 10 } },
  chess_blitz: { last: { rating: 880, date: 1795600000, rd: 70 }, record: { win: 40, loss: 50, draw: 5 } },
  chess_bullet: { last: { rating: 1500, date: 1700000000, rd: 90 }, record: { win: 10, loss: 10, draw: 0 } },
  tactics: { highest: { rating: 1820, date: 1780000000 }, lowest: { rating: 400, date: 1700000000 } },
  puzzle_rush: { best: { total_attempts: 30, score: 25 } },
}

describe('Schach', () => {
  it('liest die chess.com-Antwort', () => {
    const v = parseChessComStats(sample)
    expect(v).toMatchObject({ rapid: 1043, blitz: 880, bullet: 1500, daily: null, puzzle: 1820, games: 345 })
    expect(v.lastPlayed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(parseChessComStats({})).toMatchObject({ rapid: null, games: 0, lastPlayed: null })
  })
  it('maßgeblich ist die beste Wertung ohne Bullet, sonst Puzzles', () => {
    expect(effectiveRating(parseChessComStats(sample))).toEqual({ rating: 1043, from: 'Rapid' })
    expect(effectiveRating({ rapid: null, blitz: null, bullet: 2000, daily: null, puzzle: 1600, games: 0, lastPlayed: null })).toEqual({ rating: 1200, from: 'Puzzles' })
  })
  it('realistische Skala, 1000 praktisch unerreichbar', () => {
    expect(chessRatingLevel(0)).toBe(0)
    expect(chessRatingLevel(1600)).toBe(500)
    expect(chessRatingLevel(1100)).toBeCloseTo(320)
    expect(chessRatingLevel(3500)).toBeGreaterThan(990)
    expect(chessRatingLevel(3500)).toBeLessThan(1000)
  })
  it('Erfahrung und Pausen', () => {
    expect(chessExperience(0)).toBe(0.85)
    expect(chessExperience(20000)).toBeGreaterThan(0.99)
    expect(chessActivity('2026-11-01', '2026-11-20')).toBe(1)
    expect(chessActivity('2026-01-01', '2026-11-20')).toBe(0.8)
    const v = { ...parseChessComStats(sample), lastPlayed: '2026-11-15' }
    expect(chessLevel(v, '2026-11-20')).toBeCloseTo(chessRatingLevel(1043) * chessExperience(345))
    expect(chessLevel(null, '2026-11-20')).toBe(0)
  })
  it('prüft Benutzernamen', () => {
    expect(isChessUsername('Max_Mustermann-2')).toBe(true)
    expect(isChessUsername('a b')).toBe(false)
    expect(isChessUsername('ab')).toBe(false)
  })
})
