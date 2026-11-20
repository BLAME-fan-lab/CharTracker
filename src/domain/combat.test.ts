import { describe, expect, it } from 'vitest'
import { avatarState } from './avatar'
import {
  enemyForFloor,
  equippedSpells,
  heroStats,
  loadout,
  simulateBattle,
  ticketsEarned,
  TOWER_FLOORS,
  unlockedSpells,
  unlockedTechniques,
  type SkillLevels,
} from './combat'

const uniform = (l: number): SkillLevels => ({ academic: l, sport: l, health: l, hygiene: l, reading: l, music: l, chess: l, project: l })
const winRate = (level: number, floor: number, n = 40) => {
  const hero = loadout(uniform(level), level, avatarState(level).counts, 'demon')
  const enemy = enemyForFloor(floor)
  let wins = 0
  for (let i = 0; i < n; i++) if (simulateBattle(hero, enemy, 1000 + i).win) wins++
  return wins / n
}

describe('Kampfwerte', () => {
  it('steigen mit den Skill-Bäumen und der Ausrüstung', () => {
    const low = heroStats(uniform(0), avatarState(0).counts)
    const high = heroStats(uniform(600), avatarState(600).counts)
    expect(low).toMatchObject({ hp: 100, atk: 10, mag: 10, potions: 1, slots: 2 })
    for (const k of ['hp', 'atk', 'mag', 'def', 'spd', 'mana', 'stamina'] as const) expect(high[k]).toBeGreaterThan(low[k])
    expect(high.crit).toBeLessThanOrEqual(0.3)
  })
  it('Zauber und Techniken werden freigeschaltet', () => {
    expect(unlockedSpells(uniform(0), 0).map((s) => s.id)).toEqual(['funken'])
    expect(unlockedTechniques(uniform(0), 0).map((t) => t.id)).toEqual(['schnitt'])
    expect(unlockedSpells(uniform(1000), 1000)).toHaveLength(10)
    expect(equippedSpells(uniform(1000), 1000, 3)).toHaveLength(3)
  })
})

describe('Turm', () => {
  it('100 Etagen, Bosse auf jeder zehnten', () => {
    expect(enemyForFloor(1)).toMatchObject({ name: 'Moorgoblin', boss: false, level: 0 })
    expect(enemyForFloor(10)).toMatchObject({ name: 'Grumak', boss: true })
    expect(enemyForFloor(TOWER_FLOORS)).toMatchObject({ name: 'Malgorath', boss: true, level: 891 })
    for (let f = 2; f <= TOWER_FLOORS; f++) expect(enemyForFloor(f).hp).toBeGreaterThan(enemyForFloor(f - 1).boss ? 0 : enemyForFloor(f - 1).hp * 0.9)
  })
  it('Kampf ist deterministisch über den Seed', () => {
    const hero = loadout(uniform(200), 200, avatarState(200).counts, 'spirit')
    const a = simulateBattle(hero, enemyForFloor(20), 7)
    const b = simulateBattle(hero, enemyForFloor(20), 7)
    expect(a).toEqual(b)
    expect(a.events[0].kind).toBe('info')
  })
  it('fair: normale Gegner auf eigenem Level meist gewonnen', () => {
    for (const level of [0, 100, 200, 300, 400, 500, 600, 700, 800]) {
      let floor = Math.floor(level / 9) + 1
      if (floor % 10 === 0) floor++
      expect(winRate(level, floor), `Level ${level}, Etage ${floor}`).toBeGreaterThanOrEqual(0.6)
    }
  })
  it('Bosse sind Tore: zu früh verloren, mit Vorsprung machbar', () => {
    for (let f = 10; f <= 90; f += 10) {
      const level = 9 * (f - 1)
      expect(winRate(Math.max(0, level - 60), f), `Boss ${f} zu früh`).toBeLessThanOrEqual(0.3)
      expect(winRate(Math.min(1000, level + 100), f), `Boss ${f} mit Vorsprung`).toBeGreaterThanOrEqual(0.6)
    }
    expect(winRate(900, 100), 'Malgorath bleibt fast unmöglich').toBeLessThanOrEqual(0.1)
  })
  it('Tickets aus perfekten Tagen und Trainings', () => {
    expect(ticketsEarned(0, 0)).toBe(3)
    expect(ticketsEarned(5, 2)).toBe(10)
  })
})
