import { describe, expect, it } from 'vitest'
import { AVATAR_UNLOCKS, avatarState, unlockLabel, unlocksBetween } from './avatar'

describe('Avatar-Stufen', () => {
  it('genau eine Veränderung alle 10 Level, Stufen 1–99', () => {
    expect(AVATAR_UNLOCKS).toHaveLength(99)
    expect(AVATAR_UNLOCKS.map((u) => u.step)).toEqual(Array.from({ length: 99 }, (_, i) => i + 1))
  })
  it('Zähler pro Teil', () => {
    expect(avatarState(0)).toMatchObject({ step: 0, next: { label: 'Lederwams' } })
    expect(avatarState(0).unlocked).toHaveLength(0)
    const s = avatarState(142)
    expect(s.step).toBe(14)
    expect(s.counts.armor).toBe(2) // Kettenhemd
    expect(s.counts.grimoire).toBe(1)
    expect(s.counts.sword).toBe(2) // Langschwert
    expect(s.next?.label).toBe('Funken in der Hand')
    const max = avatarState(999)
    expect(max.counts).toMatchObject({ sword: 6, armor: 5, grimoire: 7, magic: 8, tree: 8, fusion: 6, demon: 5, apex: 1 })
    expect(max.next).toBeNull()
  })
  it('neue Teile zwischen zwei Levels', () => {
    expect(unlocksBetween(95, 112).map((u) => u.label)).toEqual(['Kettenhemd', 'Der Wald beginnt'])
    expect(unlocksBetween(140, 149)).toEqual([])
  })
  it('Verschmelzung ab Level 800, Bezeichnung je nach Pfad', () => {
    const fusion = AVATAR_UNLOCKS.filter((u) => u.key === 'fusion')
    expect(fusion[0].step).toBe(80)
    expect(unlockLabel(fusion[0], 'spirit')).toBe('Geistverschmelzung')
    expect(unlockLabel(fusion[0], 'demon')).toBe('Dämonenpakt')
    expect(unlockLabel(AVATAR_UNLOCKS[0], 'demon')).toBe('Lederwams')
    expect(AVATAR_UNLOCKS[98]).toMatchObject({ step: 99, label: 'Magierkönig' })
  })
})
