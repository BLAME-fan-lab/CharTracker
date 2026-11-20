import { describe, expect, it } from 'vitest'
import { avatarState } from './avatar'
import { enemyForFloor, loadout, simulateBattle, type SkillLevels } from './combat'
import {
  addDrops,
  BOSS_RELICS,
  CAP_STAT,
  computeBonus,
  EMPTY_INVENTORY,
  rollLoot,
  scrapTalisman,
  talismanValue,
  toggleEquip,
  upgradeCost,
  upgradeTalisman,
  type Inventory,
  type Talisman,
} from './loot'

const t = (id: string, stat: Talisman['stat'], value: number, level = 0): Talisman => ({ id, name: id, stat, rarity: 'rare', value, level })

describe('Beute', () => {
  it('ist über den Seed fest', () => {
    const e = enemyForFloor(7)
    expect(rollLoot(e, 42, 'a')).toEqual(rollLoot(e, 42, 'a'))
    expect(rollLoot(e, 42, 'a').some((d) => d.kind === 'shards')).toBe(true)
  })
  it('Bosse lassen immer ihr Relikt fallen', () => {
    for (const floor of Object.keys(BOSS_RELICS).map(Number)) {
      const drops = rollLoot(enemyForFloor(floor), 1, 'x')
      const relic = drops.find((d) => d.kind === 'talisman')
      expect(relic && relic.kind === 'talisman' && relic.talisman).toMatchObject({ relic: floor, rarity: 'legendary', name: BOSS_RELICS[floor].name })
    }
  })
  it('legt Beute in den Beutel und rüstet freie Plätze aus', () => {
    const inv = addDrops(EMPTY_INVENTORY, [
      { kind: 'talisman', talisman: t('a', 'atk', 3) },
      { kind: 'heal', amount: 1 },
      { kind: 'shards', amount: 5 },
    ])
    expect(inv).toMatchObject({ heal: 1, shards: 5, equipped: ['a'] })
    expect(addDrops(inv, [{ kind: 'talisman', talisman: t('a', 'atk', 3) }]).talismans).toHaveLength(1)
  })
})

describe('Talismane', () => {
  it('Boni werden addiert und gedeckelt', () => {
    let inv: Inventory = { ...EMPTY_INVENTORY, talismans: [t('a', 'atk', 9), t('b', 'atk', 9), t('c', 'fire', 10), t('d', 'mag', 4)] }
    inv = toggleEquip(toggleEquip(toggleEquip(inv, 'a'), 'b'), 'c')
    expect(toggleEquip(inv, 'd').equipped).toHaveLength(3)
    const b = computeBonus(inv)
    expect(b.atk).toBe(CAP_STAT)
    expect(b.elem.fire).toBe(10)
    expect(b.mag).toBe(0)
  })
  it('Schmiede kostet Splitter und hebt den Wert', () => {
    const inv: Inventory = { ...EMPTY_INVENTORY, shards: 100, talismans: [t('a', 'atk', 3)] }
    const up = upgradeTalisman(inv, 'a')
    expect(up.shards).toBe(100 - upgradeCost(inv.talismans[0]))
    expect(talismanValue(up.talismans[0])).toBe(4)
    expect(upgradeTalisman({ ...inv, shards: 0 }, 'a')).toEqual({ ...inv, shards: 0 })
  })
  it('Zerlegen gibt Splitter, Relikte bleiben', () => {
    const relic = { ...t('r', 'atk', 8), relic: 10 }
    const inv: Inventory = { ...EMPTY_INVENTORY, talismans: [t('a', 'atk', 3), relic], equipped: ['a'] }
    expect(scrapTalisman(inv, 'a')).toMatchObject({ shards: 3, equipped: [] })
    expect(scrapTalisman(inv, 'r')).toBe(inv)
  })
  it('Boni und Tränke machen den Helden stärker', () => {
    const s: SkillLevels = { academic: 300, sport: 300, health: 300, hygiene: 300, reading: 300, music: 300, chess: 300, project: 300 }
    const counts = avatarState(300).counts
    const base = loadout(s, 300, counts, 'demon')
    const boosted = loadout(s, 300, counts, 'demon', { bonus: { atk: 15, mag: 15, hp: 15, def: 15, spd: 0, mana: 15, crit: 5, elem: {} }, heal: 3 })
    expect(boosted.stats.atk).toBeGreaterThan(base.stats.atk)
    const boss = enemyForFloor(40)
    let a = 0
    let b = 0
    for (let i = 0; i < 40; i++) {
      if (simulateBattle(base, boss, i).win) a++
      if (simulateBattle(boosted, boss, i).win) b++
    }
    expect(b).toBeGreaterThan(a)
  })
})
