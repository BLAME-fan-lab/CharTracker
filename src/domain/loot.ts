/*
 * Beute aus dem Turm: Talismane (3 Plätze, gedeckelte Boni), Tränke und Seelensplitter.
 * Jeder Boss lässt ein eigenes Relikt fallen. Alles wird über den Kampf-Seed fest ausgewürfelt.
 */

import { mulberry32, NO_BONUS, type Bonus, type Element, type Enemy } from './combat'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type ElemBoost = Exclude<Element, 'phys'>
export type BoostStat = 'atk' | 'mag' | 'hp' | 'def' | 'spd' | 'crit' | 'mana' | 'all' | ElemBoost

export interface Talisman {
  id: string
  name: string
  stat: BoostStat
  rarity: Rarity
  /** Grundwert in Prozent (Krit: Prozentpunkte) */
  value: number
  /** Schmiede-Stufe 0–5 */
  level: number
  /** Boss-Etage, wenn es ein Relikt ist */
  relic?: number
}

export interface Inventory {
  talismans: Talisman[]
  /** IDs der ausgerüsteten Talismane, höchstens SLOTS */
  equipped: string[]
  heal: number
  mana: number
  shards: number
}

export const EMPTY_INVENTORY: Inventory = { talismans: [], equipped: [], heal: 0, mana: 0, shards: 0 }
export const SLOTS = 3
export const MAX_TALISMAN_LEVEL = 5
export const MAX_TALISMANS = 40
/** Obergrenzen, damit das echte Leben der Hauptantrieb bleibt */
export const CAP_STAT = 15
export const CAP_CRIT = 5
export const CAP_ELEM = 25

export const STAT_INFO: Record<BoostStat, { label: string; short: string; color: string; base: string }> = {
  atk: { label: 'Angriff', short: 'ANG', color: '#f87171', base: 'Klingenrune' },
  mag: { label: 'Magie', short: 'MAG', color: '#a78bfa', base: 'Arkanrune' },
  hp: { label: 'Leben', short: 'LEB', color: '#4ade80', base: 'Lebensstein' },
  def: { label: 'Rüstung', short: 'RÜS', color: '#60a5fa', base: 'Wächteramulett' },
  spd: { label: 'Tempo', short: 'TEM', color: '#22d3ee', base: 'Windfeder' },
  crit: { label: 'Krit', short: 'KRT', color: '#fbbf24', base: 'Falkenauge' },
  mana: { label: 'Mana', short: 'MAN', color: '#818cf8', base: 'Mondtropfen' },
  all: { label: 'Alle Werte', short: 'ALL', color: '#facc15', base: 'Krone' },
  fire: { label: 'Feuerschaden', short: 'FEU', color: '#fb923c', base: 'Glutstein' },
  ice: { label: 'Eisschaden', short: 'EIS', color: '#67e8f9', base: 'Frostsplitter' },
  light: { label: 'Lichtschaden', short: 'LIC', color: '#fde047', base: 'Sonnenperle' },
  shadow: { label: 'Schattenschaden', short: 'SCH', color: '#e879f9', base: 'Schattenperle' },
  arcane: { label: 'Arkanschaden', short: 'ARK', color: '#f472b6', base: 'Runenprisma' },
}

export const RARITY_INFO: Record<Rarity, { label: string; range: [number, number]; scrap: number; costMul: number }> = {
  common: { label: 'Gewöhnlich', range: [2, 3], scrap: 1, costMul: 1 },
  rare: { label: 'Selten', range: [3, 5], scrap: 3, costMul: 2 },
  epic: { label: 'Episch', range: [5, 7], scrap: 6, costMul: 3 },
  legendary: { label: 'Legendär', range: [8, 10], scrap: 12, costMul: 4 },
}

/** Krit zählt in Prozentpunkten (kleiner), Elemente stärker, Leben und Rüstung etwas mehr */
const STAT_SCALE: Record<BoostStat, number> = {
  atk: 1,
  mag: 1,
  hp: 1.2,
  def: 1.2,
  spd: 1,
  crit: 0.4,
  mana: 1.2,
  all: 0.6,
  fire: 2,
  ice: 2,
  light: 2,
  shadow: 2,
  arcane: 2,
}

/** Eigene Relikte der zehn Bosse */
export const BOSS_RELICS: Record<number, { name: string; stat: BoostStat; value: number }> = {
  10: { name: 'Grumaks Hauer', stat: 'atk', value: 8 },
  20: { name: 'Ysras Eiskristall', stat: 'ice', value: 16 },
  30: { name: 'Kagenais Schattenschleier', stat: 'spd', value: 10 },
  40: { name: 'Morvaths Kettenglied', stat: 'def', value: 10 },
  50: { name: 'Spiegelscherbe', stat: 'mag', value: 8 },
  60: { name: 'Varns leerer Helm', stat: 'hp', value: 10 },
  70: { name: 'Kiravas Klingenband', stat: 'crit', value: 4 },
  80: { name: 'Seelenstein', stat: 'mana', value: 12 },
  90: { name: 'Seraphons Feder', stat: 'light', value: 18 },
  100: { name: 'Malgoraths Krone', stat: 'all', value: 6 },
}

/** Wert inklusive Schmiede-Stufen */
export function talismanValue(t: Talisman) {
  const step = t.stat === 'crit' ? 0.5 : STAT_SCALE[t.stat] >= 2 ? 2 : 1
  return Math.round((t.value + t.level * step) * 10) / 10
}

export function formatBoost(t: Talisman) {
  const v = talismanValue(t)
  return t.stat === 'crit' ? `+${v} % Krit` : `+${v} % ${STAT_INFO[t.stat].label}`
}

export function equippedTalismans(inv: Inventory): Talisman[] {
  return inv.equipped.map((id) => inv.talismans.find((t) => t.id === id)).filter((t): t is Talisman => !!t)
}

/** Summe der ausgerüsteten Boni, mit Obergrenzen */
export function computeBonus(inv: Inventory): Bonus {
  const b: Bonus = { ...NO_BONUS, elem: {} }
  for (const t of equippedTalismans(inv)) {
    const v = talismanValue(t)
    switch (t.stat) {
      case 'all':
        b.atk += v
        b.mag += v
        b.hp += v
        b.def += v
        b.spd += v
        b.mana += v
        break
      case 'atk':
      case 'mag':
      case 'hp':
      case 'def':
      case 'spd':
      case 'mana':
      case 'crit':
        b[t.stat] += v
        break
      default:
        b.elem[t.stat] = (b.elem[t.stat] ?? 0) + v
    }
  }
  for (const k of ['atk', 'mag', 'hp', 'def', 'spd', 'mana'] as const) b[k] = Math.min(CAP_STAT, b[k])
  b.crit = Math.min(CAP_CRIT, b.crit)
  for (const k of Object.keys(b.elem) as ElemBoost[]) b.elem[k] = Math.min(CAP_ELEM, b.elem[k] ?? 0)
  return b
}

/** Leuchtfarben der ausgerüsteten Talismane */
export const boostColors = (inv: Inventory) => equippedTalismans(inv).map((t) => STAT_INFO[t.stat].color)

export const upgradeCost = (t: Talisman) => (t.level + 1) * 3 * RARITY_INFO[t.rarity].costMul
export const scrapValue = (t: Talisman) => RARITY_INFO[t.rarity].scrap * (1 + t.level)

/* ---------- Beute ---------- */

export type Drop =
  | { kind: 'talisman'; talisman: Talisman }
  | { kind: 'heal' | 'mana' | 'shards'; amount: number }

const RANDOM_STATS: BoostStat[] = ['atk', 'mag', 'hp', 'def', 'spd', 'crit', 'mana', 'fire', 'ice', 'light', 'shadow', 'arcane']

function rollRarity(floor: number, r: number): Rarity {
  const epic = Math.min(0.15, 0.02 + floor * 0.0015)
  const rare = Math.min(0.4, 0.15 + floor * 0.003)
  if (r < epic) return 'epic'
  if (r < epic + rare) return 'rare'
  return 'common'
}

function makeTalisman(id: string, stat: BoostStat, rarity: Rarity, r: number): Talisman {
  const [lo, hi] = RARITY_INFO[rarity].range
  const raw = (lo + Math.floor(r * (hi - lo + 1))) * STAT_SCALE[stat]
  return { id, name: STAT_INFO[stat].base, stat, rarity, value: Math.max(1, Math.round(raw)), level: 0 }
}

/** Was ein besiegter Gegner fallen lässt – fest über den Seed */
export function rollLoot(enemy: Enemy, seed: number, idBase: string): Drop[] {
  const rnd = mulberry32(seed ^ 0x5bd1e995)
  const drops: Drop[] = []
  if (enemy.boss) {
    const relic = BOSS_RELICS[enemy.floor]
    if (relic) {
      drops.push({
        kind: 'talisman',
        talisman: { id: `relic-${enemy.floor}`, name: relic.name, stat: relic.stat, rarity: 'legendary', value: relic.value, level: 0, relic: enemy.floor },
      })
    }
    drops.push({ kind: 'shards', amount: 4 + Math.floor(enemy.floor / 20) })
    drops.push({ kind: 'heal', amount: 1 })
    return drops
  }
  drops.push({ kind: 'shards', amount: 1 + Math.floor(enemy.floor / 15) })
  if (rnd() < 0.35) drops.push({ kind: rnd() < 0.65 ? 'heal' : 'mana', amount: 1 })
  if (rnd() < 0.3) {
    const stat = RANDOM_STATS[Math.floor(rnd() * RANDOM_STATS.length)]
    drops.push({ kind: 'talisman', talisman: makeTalisman(`t-${idBase}`, stat, rollRarity(enemy.floor, rnd()), rnd()) })
  }
  return drops
}

/** Beute in den Beutel legen; ist er voll, wird der schwächste nicht ausgerüstete Talisman zerlegt */
export function addDrops(inv: Inventory, drops: Drop[]): Inventory {
  const next: Inventory = { ...inv, talismans: [...inv.talismans], equipped: [...inv.equipped] }
  for (const d of drops) {
    if (d.kind === 'talisman') {
      if (next.talismans.some((t) => t.id === d.talisman.id)) continue
      next.talismans.push(d.talisman)
      if (next.equipped.length < SLOTS) next.equipped.push(d.talisman.id)
    } else if (d.kind === 'heal') next.heal += d.amount
    else if (d.kind === 'mana') next.mana += d.amount
    else next.shards += d.amount
  }
  while (next.talismans.length > MAX_TALISMANS) {
    const loose = next.talismans.filter((t) => !next.equipped.includes(t.id) && !t.relic)
    if (!loose.length) break
    const weakest = loose.reduce((a, b) => (scrapValue(a) <= scrapValue(b) ? a : b))
    next.shards += scrapValue(weakest)
    next.talismans = next.talismans.filter((t) => t.id !== weakest.id)
  }
  return next
}

export function toggleEquip(inv: Inventory, id: string): Inventory {
  if (inv.equipped.includes(id)) return { ...inv, equipped: inv.equipped.filter((e) => e !== id) }
  if (inv.equipped.length >= SLOTS) return inv
  return { ...inv, equipped: [...inv.equipped, id] }
}

export function upgradeTalisman(inv: Inventory, id: string): Inventory {
  const t = inv.talismans.find((x) => x.id === id)
  if (!t || t.level >= MAX_TALISMAN_LEVEL) return inv
  const cost = upgradeCost(t)
  if (inv.shards < cost) return inv
  return {
    ...inv,
    shards: inv.shards - cost,
    talismans: inv.talismans.map((x) => (x.id === id ? { ...x, level: x.level + 1 } : x)),
  }
}

/** Zerlegen gibt Seelensplitter; Relikte lassen sich nicht zerlegen */
export function scrapTalisman(inv: Inventory, id: string): Inventory {
  const t = inv.talismans.find((x) => x.id === id)
  if (!t || t.relic) return inv
  return {
    ...inv,
    shards: inv.shards + scrapValue(t),
    talismans: inv.talismans.filter((x) => x.id !== id),
    equipped: inv.equipped.filter((e) => e !== id),
  }
}

export const describeDrop = (d: Drop) =>
  d.kind === 'talisman'
    ? `${d.talisman.name} (${RARITY_INFO[d.talisman.rarity].label}, ${formatBoost(d.talisman)})`
    : d.kind === 'heal'
      ? `${d.amount} Heiltrank`
      : d.kind === 'mana'
        ? `${d.amount} Manatrank`
        : `${d.amount} Seelensplitter`
