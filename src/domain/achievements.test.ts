import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, bestFullStreak, evaluateAchievements, type AchievementStats } from './achievements'
import { nextRank, rankFor, RANKS } from './ranks'

const zero: AchievementStats = {
  bestPerfectStreak: 0, bestHabitStreak: 0, studyHours: 0, unitsDone: 0, modulesComplete: 0, bestGrade: null,
  trainings: 0, bestTrainingWeekStreak: 0, benchRatio: 0, pullups: 0, bestStandard: 0, booksDone: 0, hardBooksDone: 0,
  bestReadingWeekStreak: 0, musicHours: 0, musicMilestone: 0, projectMilestones: 0, largeMilestones: 0, projectHours: 0,
  todosDone: 0, characterLevel: 0, maxSkillLevel: 0, hasBackup: false,
}

describe('Ränge', () => {
  it('je 100 Level ein Rang', () => {
    expect(rankFor(0).name).toBe('Novize')
    expect(rankFor(99.9).name).toBe('Novize')
    expect(rankFor(100).name).toBe('Lehrling')
    expect(rankFor(912).name).toBe('Legende')
    expect(RANKS).toHaveLength(10)
  })
  it('nächster Rang und Abstand', () => {
    expect(nextRank(210)).toMatchObject({ rank: { name: 'Fortgeschrittener' }, missing: 90 })
    expect(nextRank(299.5)?.missing).toBe(1)
    expect(nextRank(950)).toBeNull()
  })
})

describe('Errungenschaften', () => {
  it('eindeutige IDs', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
  })
  it('ohne Daten nichts freigeschaltet', () => {
    expect(evaluateAchievements(zero).filter((a) => a.unlocked)).toHaveLength(0)
  })
  it('Schwellen und Fortschritt', () => {
    const r = evaluateAchievements({ ...zero, bestPerfectStreak: 7, benchRatio: 1.02, studyHours: 42, hasBackup: true, bestGrade: 1.0 })
    const by = (id: string) => r.find((a) => a.achievement.id === id)!
    expect(by('r-perfect-1').unlocked).toBe(true)
    expect(by('r-perfect-7').unlocked).toBe(true)
    expect(by('r-perfect-30')).toMatchObject({ unlocked: false, current: 7, target: 30 })
    expect(by('s-bench-bw').unlocked).toBe(true)
    expect(by('u-hours-100')).toMatchObject({ unlocked: false, current: 42 })
    expect(by('c-backup').unlocked).toBe(true)
    expect(by('u-grade-1').unlocked).toBe(true)
  })
  it('längste erfüllte Folge', () => {
    expect(bestFullStreak([1, 1, 0.5, 1, 1, 1, null, 1])).toBe(4)
    expect(bestFullStreak([])).toBe(0)
  })
})

import { detectProgress, isBigEvent, sameSnapshot, snapshot } from './progressEvents'

describe('Fortschritts-Ereignisse', () => {
  const prev = snapshot(195.4, { academic: 912.3, sport: 99.6 })

  it('erster Start: keine Ereignisse', () => {
    expect(detectProgress(null, prev, ['a'], [])).toEqual([])
  })
  it('Rang-Aufstieg, neue Errungenschaft, neue Ausrüstung, Level-Up', () => {
    const next = snapshot(201.2, { academic: 912.3, sport: 100.4 })
    const ev = detectProgress(prev, next, ['a', 'b'], ['a'])
    expect(ev.map((e) => e.kind)).toEqual(['rank-up', 'rank-up', 'achievement', 'item', 'level-up'])
    expect(ev[0]).toMatchObject({ skill: null, rank: { name: 'Geselle' } })
    expect(ev[1]).toMatchObject({ skill: 'sport', rank: { name: 'Lehrling' } })
    expect(ev[3]).toMatchObject({ unlock: { step: 20, label: 'Begleit-Drohne' } })
    expect(ev.filter(isBigEvent)).toHaveLength(4)
  })
  it('Ausrüstung nur beim Überschreiten einer 10er-Grenze', () => {
    expect(detectProgress(prev, snapshot(199.9, { academic: 912.3, sport: 99.6 }), [], []).map((e) => e.kind)).toEqual(['level-up'])
    const jump = detectProgress(snapshot(118, {}), snapshot(141, {}), [], [])
    expect(jump.filter((e) => e.kind === 'item').map((e) => (e.kind === 'item' ? e.unlock.step : 0))).toEqual([12, 13, 14])
  })
  it('kleiner Anstieg ohne Rangwechsel: nur Level-Up; Rückgang: nichts', () => {
    expect(detectProgress(prev, snapshot(196.1, { academic: 912.3, sport: 99.6 }), [], []).map((e) => e.kind)).toEqual(['level-up'])
    expect(detectProgress(prev, snapshot(190, { academic: 900, sport: 50 }), [], [])).toEqual([])
  })
  it('Schnappschuss-Vergleich ignoriert Rundungsrauschen', () => {
    expect(sameSnapshot(snapshot(195.41, { a: 1.04 }), snapshot(195.44, { a: 1.01 }))).toBe(true)
    expect(sameSnapshot(snapshot(195.4, { a: 1 }), snapshot(195.6, { a: 1 }))).toBe(false)
  })
})
