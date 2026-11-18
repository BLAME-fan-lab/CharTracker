import { describe, expect, it } from 'vitest'
import { AVATAR_UNLOCKS, avatarState, unlocksBetween } from './avatar'

describe('Avatar-Stufen', () => {
  it('genau eine Veränderung alle 10 Level, Stufen 1–99', () => {
    expect(AVATAR_UNLOCKS).toHaveLength(99)
    expect(AVATAR_UNLOCKS.map((u) => u.step)).toEqual(Array.from({ length: 99 }, (_, i) => i + 1))
  })
  it('Zähler pro Teil', () => {
    expect(avatarState(0)).toMatchObject({ step: 0, next: { label: 'Wehender Schal' } })
    expect(avatarState(0).unlocked).toHaveLength(0)
    const s = avatarState(142)
    expect(s.step).toBe(14)
    expect(s.counts.mouth).toBe(2) // Gasmaske
    expect(s.counts.building).toBe(2)
    expect(s.next?.label).toBe('Taschen am Gürtel')
    const max = avatarState(999)
    expect(max.counts).toMatchObject({ building: 11, tally: 10, crow: 5, star: 5, scar: 3, mouth: 3, headwear: 4, eyes: 4, apex: 1 })
    expect(max.next).toBeNull()
  })
  it('neue Teile zwischen zwei Levels', () => {
    expect(unlocksBetween(95, 112).map((u) => u.label)).toEqual(['Gasmaske', 'Aufrechter Gang'])
    expect(unlocksBetween(140, 149)).toEqual([])
  })
})
