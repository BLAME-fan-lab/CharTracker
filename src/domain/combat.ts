/*
 * Kampfsystem: Turm der Prüfungen.
 * Die Kampfwerte kommen aus den echten Skill-Bäumen und der Avatar-Ausrüstung.
 * Ein Kampf läuft automatisch ab (rundenbasiert, deterministisch über einen Seed).
 * Alle Gegner sind eigene Figuren.
 */

import { avatarState, type AvatarCounts, type AvatarPath } from './avatar'
import type { SkillKey } from './characterSheet'

export type Element = 'phys' | 'fire' | 'ice' | 'light' | 'shadow' | 'arcane'
export const ELEMENT_LABEL: Record<Element, string> = {
  phys: 'Körper',
  fire: 'Feuer',
  ice: 'Eis',
  light: 'Licht',
  shadow: 'Schatten',
  arcane: 'Arkan',
}

export type SkillLevels = Record<SkillKey, number>

/* ---------- Werte des Helden ---------- */

export interface HeroStats {
  hp: number
  atk: number
  mag: number
  def: number
  spd: number
  /** Chance auf kritischen Treffer, 0–1 */
  crit: number
  mana: number
  stamina: number
  potions: number
  /** wie viele Zauber gleichzeitig ausgerüstet sind */
  slots: number
}

type Gear = Pick<AvatarCounts, 'sword' | 'armor' | 'grimoire' | 'shield' | 'legs' | 'shoulders' | 'arms' | 'belt'>

export function heroStats(s: SkillLevels, gear: Gear): HeroStats {
  return {
    hp: Math.round(100 + s.sport * 1.0 + s.health * 1.0 + gear.armor * 12 + gear.shield * 10 + (gear.legs + gear.shoulders + gear.arms) * 6),
    atk: Math.round(10 + s.sport * 0.12 + gear.sword * 4),
    mag: Math.round(10 + s.academic * 0.12 + s.reading * 0.04 + gear.grimoire * 3),
    def: Math.round(4 + s.health * 0.06 + gear.armor * 3 + gear.shield * 3 + gear.legs + gear.shoulders + gear.arms),
    spd: Math.round(10 + s.music * 0.08 + s.sport * 0.02),
    // Hygiene (Disziplin) und Schach (Voraussicht) bringen kritische Treffer
    crit: Math.min(0.3, 0.05 + (s.hygiene / 1000) * 0.12 + (s.chess / 1000) * 0.12),
    mana: Math.round(40 + s.academic * 0.25 + s.reading * 0.2),
    stamina: Math.round(40 + s.sport * 0.2 + s.health * 0.05),
    potions: 1 + Math.floor(s.project / 250) + (gear.belt >= 4 ? 1 : 0),
    slots: Math.min(6, 2 + Math.floor(s.reading / 200)),
  }
}

/* ---------- Zauber und Techniken ---------- */

type Requirement = { skill: SkillKey | 'level'; min: number }

export interface Spell {
  id: string
  name: string
  element: Element
  kind: 'damage' | 'heal' | 'shield' | 'regen' | 'haste' | 'drain'
  power: number
  cost: number
  req: Requirement
  desc: string
}

export interface Technique {
  id: string
  name: string
  kind: 'damage' | 'counter' | 'pierce'
  power: number
  hits: number
  cost: number
  req: Requirement
  desc: string
}

export const SPELLS: Spell[] = [
  { id: 'funken', name: 'Funkenstoß', element: 'fire', kind: 'damage', power: 1.0, cost: 10, req: { skill: 'academic', min: 0 }, desc: 'Ein Stoß glühender Funken.' },
  { id: 'melodie', name: 'Heilende Melodie', element: 'light', kind: 'heal', power: 0.25, cost: 18, req: { skill: 'music', min: 50 }, desc: 'Heilt 25 % deiner Lebenspunkte.' },
  { id: 'eislanze', name: 'Eislanze', element: 'ice', kind: 'damage', power: 1.4, cost: 16, req: { skill: 'academic', min: 150 }, desc: 'Durchbohrt den Gegner, kann ihn verlangsamen.' },
  { id: 'runenschild', name: 'Runenschild', element: 'arcane', kind: 'shield', power: 0.5, cost: 14, req: { skill: 'reading', min: 100 }, desc: 'Halbiert den Schaden für zwei Runden.' },
  { id: 'kettenblitz', name: 'Kettenblitz', element: 'arcane', kind: 'damage', power: 1.9, cost: 24, req: { skill: 'academic', min: 300 }, desc: 'Ein Blitz, der zwischen Runen springt.' },
  { id: 'lebensquell', name: 'Lebensquell', element: 'light', kind: 'regen', power: 0.08, cost: 20, req: { skill: 'health', min: 250 }, desc: 'Heilt drei Runden lang je 8 %.' },
  { id: 'sternenfall', name: 'Sternenfall', element: 'light', kind: 'damage', power: 2.6, cost: 34, req: { skill: 'academic', min: 500 }, desc: 'Sterne stürzen auf den Gegner.' },
  { id: 'zeitriss', name: 'Zeitriss', element: 'arcane', kind: 'haste', power: 1, cost: 22, req: { skill: 'reading', min: 400 }, desc: 'Du handelst in der nächsten Runde zweimal.' },
  { id: 'seelenbann', name: 'Seelenbann', element: 'shadow', kind: 'drain', power: 3.3, cost: 46, req: { skill: 'academic', min: 700 }, desc: 'Starker Schattenzauber, heilt dich um 30 % des Schadens.' },
  { id: 'urzauber', name: 'Urzauber', element: 'light', kind: 'damage', power: 4.4, cost: 60, req: { skill: 'level', min: 800 }, desc: 'Die Kraft deiner Verschmelzung.' },
]

export const TECHNIQUES: Technique[] = [
  { id: 'schnitt', name: 'Schnitt', kind: 'damage', power: 1.0, hits: 1, cost: 0, req: { skill: 'sport', min: 0 }, desc: 'Ein sauberer Schwerthieb.' },
  { id: 'doppelhieb', name: 'Doppelhieb', kind: 'damage', power: 0.7, hits: 2, cost: 8, req: { skill: 'sport', min: 50 }, desc: 'Zwei schnelle Hiebe.' },
  { id: 'konter', name: 'Konter', kind: 'counter', power: 0.6, hits: 1, cost: 10, req: { skill: 'sport', min: 150 }, desc: 'Fängt den nächsten Angriff ab und schlägt 60 % zurück.' },
  { id: 'schildbrecher', name: 'Schildbrecher', kind: 'pierce', power: 1.5, hits: 1, cost: 12, req: { skill: 'sport', min: 250 }, desc: 'Ignoriert die Verteidigung des Gegners.' },
  { id: 'gambit', name: 'Gambit', kind: 'pierce', power: 1.2, hits: 2, cost: 14, req: { skill: 'chess', min: 300 }, desc: 'Ein geopferter Hieb öffnet die Deckung: zwei durchdringende Treffer.' },
  { id: 'wirbelhieb', name: 'Wirbelhieb', kind: 'damage', power: 2.2, hits: 1, cost: 18, req: { skill: 'sport', min: 400 }, desc: 'Ein Hieb mit voller Drehung.' },
  { id: 'klingensturm', name: 'Klingensturm', kind: 'damage', power: 0.6, hits: 5, cost: 26, req: { skill: 'sport', min: 600 }, desc: 'Fünf Hiebe in einem Atemzug.' },
  { id: 'drachenschnitt', name: 'Drachenschnitt', kind: 'damage', power: 3.6, hits: 1, cost: 34, req: { skill: 'sport', min: 800 }, desc: 'Der stärkste Schwerthieb.' },
]

/** Name des stärksten Zaubers hängt vom Pfad der Verschmelzung ab */
export function spellName(sp: Spell, path: AvatarPath) {
  if (sp.id !== 'urzauber') return sp.name
  return path === 'demon' ? 'Höllenfeuer' : 'Lichtgericht'
}
export function spellElement(sp: Spell, path: AvatarPath): Element {
  if (sp.id !== 'urzauber') return sp.element
  return path === 'demon' ? 'shadow' : 'light'
}

const meets = (r: Requirement, s: SkillLevels, level: number) => (r.skill === 'level' ? level : s[r.skill]) >= r.min
export const unlockedSpells = (s: SkillLevels, level: number) => SPELLS.filter((sp) => meets(sp.req, s, level))
export const unlockedTechniques = (s: SkillLevels, level: number) => TECHNIQUES.filter((t) => meets(t.req, s, level))

/**
 * Ausgerüstete Zauber: Heil- und Schutzzauber zuerst, dann die stärksten Angriffe.
 * Mit `score` (z. B. Schwäche des Gegners) wählt der Held passend zum Gegner aus.
 */
export function pickSpells(all: Spell[], slots: number, score: (sp: Spell) => number = (sp) => sp.power): Spell[] {
  const support = all.filter((sp) => sp.kind !== 'damage' && sp.kind !== 'drain')
  const attack = all.filter((sp) => sp.kind === 'damage' || sp.kind === 'drain').sort((a, b) => score(b) - score(a))
  const pick = [...support.slice(0, Math.max(1, slots - 2)), ...attack]
  return pick.slice(0, slots)
}

export function equippedSpells(s: SkillLevels, level: number, slots: number): Spell[] {
  return pickSpells(unlockedSpells(s, level), slots)
}

/* ---------- Gegner ---------- */

export type Trait = 'none' | 'heavy' | 'slow' | 'evade' | 'bind' | 'mimic' | 'regen' | 'multi' | 'drain' | 'phases'

export const TRAIT_LABEL: Record<Trait, string> = {
  none: 'Keine Besonderheit',
  heavy: 'Holt zu schweren Schlägen aus',
  slow: 'Verlangsamt dich',
  evade: 'Weicht Schwerthieben aus',
  bind: 'Fesselt dich',
  mimic: 'Kopiert deine Magie',
  regen: 'Regeneriert sich',
  multi: 'Greift mehrfach an',
  drain: 'Saugt Mana und Ausdauer',
  phases: 'Wird bei halber Kraft stärker',
}

export interface EnemyLook {
  body: 'humanoid' | 'beast' | 'golem' | 'wisp' | 'giant'
  head: 'skull' | 'horns' | 'hood' | 'helmet' | 'crown' | 'mask' | 'beast' | 'none'
  weapon: 'none' | 'sword' | 'greatsword' | 'staff' | 'claws' | 'chains' | 'scythe' | 'dual'
  cape?: boolean
  wings?: boolean
  aura?: boolean
}

interface EnemyDef {
  name: string
  title: string
  look: EnemyLook
  trait: Trait
  weak?: Element
  resist?: Element
}

export interface Enemy extends EnemyDef {
  floor: number
  boss: boolean
  /** Charakterlevel, bei dem der Kampf ausgeglichen ist */
  level: number
  hp: number
  atk: number
  def: number
  spd: number
}

const GRUNTS: EnemyDef[] = [
  { name: 'Moorgoblin', title: 'Plünderer aus dem Sumpf', look: { body: 'humanoid', head: 'beast', weapon: 'sword' }, trait: 'none', weak: 'fire' },
  { name: 'Knochenwache', title: 'Untoter Torwächter', look: { body: 'humanoid', head: 'skull', weapon: 'sword' }, trait: 'none', weak: 'light', resist: 'shadow' },
  { name: 'Schattenwolf', title: 'Jäger der Nacht', look: { body: 'beast', head: 'beast', weapon: 'claws' }, trait: 'multi', weak: 'light' },
  { name: 'Irrlichtschwarm', title: 'Verlorene Seelen', look: { body: 'wisp', head: 'none', weapon: 'none', aura: true }, trait: 'evade', weak: 'arcane', resist: 'phys' },
  { name: 'Fluchritter', title: 'Gefallener Ordensbruder', look: { body: 'humanoid', head: 'helmet', weapon: 'greatsword', cape: true }, trait: 'heavy', weak: 'light' },
  { name: 'Nebelassassine', title: 'Klinge im Dunst', look: { body: 'humanoid', head: 'mask', weapon: 'dual', cape: true }, trait: 'evade', weak: 'fire' },
  { name: 'Steingolem', title: 'Erwachter Fels', look: { body: 'golem', head: 'none', weapon: 'none' }, trait: 'heavy', weak: 'arcane', resist: 'phys' },
  { name: 'Blutfledermaus', title: 'Durstiger Schwarm', look: { body: 'beast', head: 'beast', weapon: 'claws', wings: true }, trait: 'drain', weak: 'light' },
  { name: 'Runenwächter', title: 'Hüter alter Siegel', look: { body: 'golem', head: 'mask', weapon: 'staff', aura: true }, trait: 'regen', weak: 'shadow', resist: 'arcane' },
  { name: 'Dornenhexe', title: 'Herrin des Dickichts', look: { body: 'humanoid', head: 'hood', weapon: 'staff', cape: true }, trait: 'slow', weak: 'fire', resist: 'ice' },
  { name: 'Aschedämon', title: 'Glut aus der Tiefe', look: { body: 'humanoid', head: 'horns', weapon: 'claws', aura: true }, trait: 'none', weak: 'ice', resist: 'fire' },
  { name: 'Klingenkultist', title: 'Diener des Abgrunds', look: { body: 'humanoid', head: 'hood', weapon: 'dual' }, trait: 'multi', weak: 'light', resist: 'shadow' },
]

const BOSSES: EnemyDef[] = [
  { name: 'Grumak', title: 'Ork-Häuptling', look: { body: 'giant', head: 'horns', weapon: 'greatsword' }, trait: 'heavy', weak: 'ice' },
  { name: 'Ysra', title: 'Die Eiskönigin', look: { body: 'humanoid', head: 'crown', weapon: 'staff', cape: true, aura: true }, trait: 'slow', weak: 'fire', resist: 'ice' },
  { name: 'Kagenai', title: 'Der Schattenläufer', look: { body: 'humanoid', head: 'mask', weapon: 'dual', cape: true }, trait: 'evade', weak: 'light', resist: 'shadow' },
  { name: 'Morvath', title: 'Der Kettenmagier', look: { body: 'humanoid', head: 'hood', weapon: 'chains', aura: true }, trait: 'bind', weak: 'phys', resist: 'arcane' },
  { name: 'Der Gestaltwandler', title: 'Spiegel deiner selbst', look: { body: 'humanoid', head: 'none', weapon: 'none', aura: true }, trait: 'mimic' },
  { name: 'Varn', title: 'Der leere Ritter', look: { body: 'humanoid', head: 'helmet', weapon: 'greatsword', cape: true }, trait: 'regen', weak: 'light', resist: 'phys' },
  { name: 'Kirava', title: 'Die Klingentänzerin', look: { body: 'humanoid', head: 'mask', weapon: 'dual' }, trait: 'multi', weak: 'ice' },
  { name: 'Der Seelenfresser', title: 'Hunger ohne Ende', look: { body: 'giant', head: 'skull', weapon: 'scythe', wings: true }, trait: 'drain', weak: 'light', resist: 'shadow' },
  { name: 'Seraphon', title: 'Der gefallene Erzengel', look: { body: 'humanoid', head: 'crown', weapon: 'sword', wings: true, aura: true }, trait: 'phases', weak: 'shadow', resist: 'light' },
  { name: 'Malgorath', title: 'Der Dämonenfürst', look: { body: 'giant', head: 'horns', weapon: 'greatsword', wings: true, cape: true, aura: true }, trait: 'phases', weak: 'light', resist: 'fire' },
]

export const TOWER_FLOORS = 100

/** Gleichmäßiger Vergleichsheld auf einem Level (alle Bäume gleich, Ausrüstung passend) */
export function referenceHero(level: number): HeroStats {
  const s: SkillLevels = { academic: level, sport: level, health: level, hygiene: level, reading: level, music: level, chess: level, project: level }
  return heroStats(s, avatarState(level).counts)
}

/** Stärkster Einzelzug des Vergleichshelden (Technik oder Zauber) */
function referenceBest(level: number) {
  const s: SkillLevels = { academic: level, sport: level, health: level, hygiene: level, reading: level, music: level, chess: level, project: level }
  const st = referenceHero(level)
  const tech = unlockedTechniques(s, level).map((t) => st.atk * t.power * t.hits)
  const spells = equippedSpells(s, level, st.slots)
    .filter((sp) => sp.kind === 'damage' || sp.kind === 'drain')
    .map((sp) => st.mag * sp.power)
  return Math.max(...tech, ...spells)
}

export function enemyForFloor(floor: number): Enemy {
  const f = Math.max(1, Math.min(TOWER_FLOORS, Math.floor(floor)))
  const boss = f % 10 === 0
  const def = boss ? BOSSES[f / 10 - 1] : GRUNTS[(f - 1) % GRUNTS.length]
  const level = 9 * (f - 1)
  const ref = referenceHero(level)
  const best = referenceBest(level)
  const eDef = Math.round(Math.max(ref.atk, ref.mag) * 0.12)
  // je höher die Etage, desto mehr über dem Vergleichshelden
  const ramp = 1 + (f - 1) * 0.0025
  return {
    ...def,
    floor: f,
    boss,
    level,
    def: eDef,
    hp: Math.round(Math.max(30, (best - eDef) * 6.5) * ramp * (boss ? 1.35 : 1)),
    atk: Math.round((ref.hp / 7 + ref.def) * ramp * (boss ? 1.05 : 1)),
    spd: Math.round(ref.spd * (boss ? 1.05 : 0.95)),
  }
}

/* ---------- Kampf ---------- */

export interface BattleEvent {
  actor: 'hero' | 'enemy' | 'info'
  text: string
  kind: 'hit' | 'crit' | 'heal' | 'miss' | 'buff' | 'info'
  heroHp: number
  enemyHp: number
}

export interface BattleResult {
  win: boolean
  rounds: number
  /** verbrauchte Tränke aus dem Beutel (nicht die freien aus dem Projekt-Baum) */
  usedHeal: number
  usedMana: number
  events: BattleEvent[]
  heroMax: number
  enemyMax: number
}

/** kleiner, schneller Zufallsgenerator mit Seed */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Boni aus ausgerüsteten Talismanen (Prozent, Krit in Prozentpunkten) */
export interface Bonus {
  atk: number
  mag: number
  hp: number
  def: number
  spd: number
  mana: number
  crit: number
  elem: Partial<Record<Element, number>>
}
export const NO_BONUS: Bonus = { atk: 0, mag: 0, hp: 0, def: 0, spd: 0, mana: 0, crit: 0, elem: {} }

export function applyBonus(st: HeroStats, b: Bonus): HeroStats {
  const up = (v: number, pct: number) => Math.round(v * (1 + pct / 100))
  return {
    ...st,
    hp: up(st.hp, b.hp),
    atk: up(st.atk, b.atk),
    mag: up(st.mag, b.mag),
    def: up(st.def, b.def),
    spd: up(st.spd, b.spd),
    mana: up(st.mana, b.mana),
    crit: Math.min(0.35, st.crit + b.crit / 100),
  }
}

export interface HeroLoadout {
  stats: HeroStats
  bonus: Bonus
  /** Tränke aus dem Beutel */
  extraHeal: number
  extraMana: number
  /** alle freigeschalteten Zauber – vor dem Kampf werden `stats.slots` davon passend zum Gegner ausgerüstet */
  spells: Spell[]
  techniques: Technique[]
  path: AvatarPath
}

export function loadout(
  skills: SkillLevels,
  level: number,
  counts: AvatarCounts,
  path: AvatarPath,
  extras: { bonus?: Bonus; heal?: number; mana?: number } = {},
): HeroLoadout {
  const bonus = extras.bonus ?? NO_BONUS
  const stats = applyBonus(heroStats(skills, counts), bonus)
  return {
    stats,
    bonus,
    extraHeal: extras.heal ?? 0,
    extraMana: extras.mana ?? 0,
    spells: unlockedSpells(skills, level),
    techniques: unlockedTechniques(skills, level),
    path,
  }
}

const MAX_ROUNDS = 40

export function simulateBattle(hero: HeroLoadout, enemy: Enemy, seed: number): BattleResult {
  const rnd = mulberry32(seed)
  const st = hero.stats
  const events: BattleEvent[] = []
  const elemModOf = (el: Element) => (enemy.weak === el ? 1.5 : enemy.resist === el ? 0.5 : 1)
  const spells = pickSpells(hero.spells, st.slots, (sp) => sp.power * elemModOf(spellElement(sp, hero.path)))
  let hp = st.hp
  let mana = st.mana
  let stamina = st.stamina
  let potions = st.potions + hero.extraHeal
  let potionsUsed = 0
  let manaPotions = hero.extraMana
  let ehp = enemy.hp
  let shield = 0
  let regen = 0
  let haste = false
  let counter = false
  let skip = false
  let charge = 0
  let enraged = false
  let enemyTurns = 0
  let skipEnemy = false

  const log = (actor: BattleEvent['actor'], text: string, kind: BattleEvent['kind']) =>
    events.push({ actor, text, kind, heroHp: Math.max(0, Math.round(hp)), enemyHp: Math.max(0, Math.round(ehp)) })
  const vary = () => 0.88 + rnd() * 0.24
  const elemMod = elemModOf

  const strike = (base: number, el: Element, pierce: boolean): { dmg: number; crit: boolean } => {
    const crit = rnd() < st.crit
    let d = base * vary() * elemMod(el) * (crit ? 1.75 : 1) * (1 + (hero.bonus.elem[el] ?? 0) / 100)
    if (!pierce) d -= enemy.def
    return { dmg: Math.max(1, Math.round(d)), crit }
  }

  const heroAct = () => {
    if (skip) {
      skip = false
      log('hero', 'Du kannst dich nicht bewegen.', 'miss')
      return
    }
    // Heilen, wenn es eng wird
    if (hp < st.hp * 0.35) {
      const heal = spells.find((s) => s.kind === 'heal' && s.cost <= mana)
      if (potions > 0 && (!heal || rnd() < 0.5)) {
        potions--
        potionsUsed++
        const amount = Math.round(st.hp * 0.3)
        hp = Math.min(st.hp, hp + amount)
        log('hero', `Du trinkst einen Heiltrank (+${amount}).`, 'heal')
        return
      }
      if (heal) {
        mana -= heal.cost
        const amount = Math.round(st.hp * heal.power)
        hp = Math.min(st.hp, hp + amount)
        log('hero', `${heal.name}: +${amount} Lebenspunkte.`, 'heal')
        return
      }
    }
    // Manatrank, wenn kein Angriffszauber mehr bezahlbar ist
    if (manaPotions > 0 && mana < st.mana * 0.25) {
      const attack = spells.filter((s) => s.kind === 'damage' || s.kind === 'drain')
      if (attack.length && attack.every((s) => s.cost > mana)) {
        manaPotions--
        const amount = Math.round(st.mana * 0.5)
        mana = Math.min(st.mana, mana + amount)
        log('hero', `Du trinkst einen Manatrank (+${amount} Mana).`, 'buff')
        return
      }
    }
    // Auf einen schweren Schlag reagieren
    if (charge === 1) {
      const ko = hero.techniques.find((t) => t.kind === 'counter' && t.cost <= stamina)
      if (ko) {
        stamina -= ko.cost
        counter = true
        log('hero', 'Du gehst in Konterstellung.', 'buff')
        return
      }
      const sh = spells.find((s) => s.kind === 'shield' && s.cost <= mana)
      if (sh && shield === 0) {
        mana -= sh.cost
        shield = 2
        log('hero', `${sh.name} schützt dich.`, 'buff')
        return
      }
    }
    // Unterstützung zu Beginn
    if (regen === 0 && hp < st.hp * 0.75) {
      const rg = spells.find((s) => s.kind === 'regen' && s.cost <= mana)
      if (rg && rnd() < 0.5) {
        mana -= rg.cost
        regen = 3
        log('hero', `${rg.name} umhüllt dich.`, 'buff')
        return
      }
    }
    if (!haste) {
      const hs = spells.find((s) => s.kind === 'haste' && s.cost <= mana)
      if (hs && rnd() < 0.3) {
        mana -= hs.cost
        haste = true
        log('hero', `${hs.name}: Die Zeit bricht auf.`, 'buff')
        return
      }
    }
    // Angriff: beste erwartete Wirkung, gelegentlich die zweitbeste
    type Option = { label: string; expected: number; run: () => void }
    const options: Option[] = []
    for (const t of hero.techniques) {
      if (t.kind === 'counter' || t.cost > stamina) continue
      const pierce = t.kind === 'pierce'
      const per = Math.max(1, st.atk * t.power * elemMod('phys') - (pierce ? 0 : enemy.def))
      const dodge = enemy.trait === 'evade' ? 0.65 : 1
      options.push({
        label: t.name,
        expected: per * t.hits * dodge,
        run: () => {
          stamina -= t.cost
          if (enemy.trait === 'evade' && rnd() < 0.35) {
            log('hero', `${t.name} – ${enemy.name} weicht aus!`, 'miss')
            return
          }
          let total = 0
          let anyCrit = false
          for (let i = 0; i < t.hits; i++) {
            const r = strike(st.atk * t.power, 'phys', pierce)
            total += r.dmg
            anyCrit ||= r.crit
          }
          ehp -= total
          log('hero', `${t.name}${t.hits > 1 ? ` (${t.hits}×)` : ''}: ${total} Schaden${anyCrit ? ', kritisch!' : '.'}`, anyCrit ? 'crit' : 'hit')
        },
      })
    }
    for (const sp of spells) {
      if ((sp.kind !== 'damage' && sp.kind !== 'drain') || sp.cost > mana) continue
      const el = spellElement(sp, hero.path)
      const name = spellName(sp, hero.path)
      options.push({
        label: name,
        expected: Math.max(1, st.mag * sp.power * elemMod(el) - enemy.def),
        run: () => {
          mana -= sp.cost
          if (enemy.trait === 'evade' && rnd() < 0.2) {
            log('hero', `${name} – ${enemy.name} entgleitet dem Zauber!`, 'miss')
            return
          }
          const r = strike(st.mag * sp.power, el, false)
          ehp -= r.dmg
          let text = `${name}: ${r.dmg} Schaden${r.crit ? ', kritisch!' : '.'}`
          if (sp.kind === 'drain') {
            const back = Math.round(r.dmg * 0.3)
            hp = Math.min(st.hp, hp + back)
            text += ` Du heilst ${back}.`
          }
          if (sp.id === 'eislanze' && rnd() < 0.25) {
            skipEnemy = true
            text += ' Der Gegner erstarrt.'
          }
          if (elemMod(el) > 1) text += ' Volltreffer auf die Schwäche!'
          log('hero', text, r.crit ? 'crit' : 'hit')
        },
      })
    }
    options.sort((a, b) => b.expected - a.expected)
    const choice = options.length > 1 && rnd() < 0.2 ? options[1] : options[0]
    choice.run()
  }

  const enemyAct = () => {
    if (skipEnemy) {
      skipEnemy = false
      log('enemy', `${enemy.name} ist erstarrt.`, 'miss')
      return
    }
    enemyTurns++
    if (enemy.trait === 'regen') {
      const heal = Math.round(enemy.hp * 0.03)
      ehp = Math.min(enemy.hp, ehp + heal)
    }
    if (enemy.trait === 'phases' && !enraged && ehp < enemy.hp * 0.5) {
      enraged = true
      log('enemy', `${enemy.name} entfesselt seine wahre Kraft!`, 'buff')
    }
    if (enemy.trait === 'heavy') {
      if (charge === 0 && enemyTurns % 3 === 0) {
        charge = 1
        log('enemy', `${enemy.name} holt zu einem gewaltigen Schlag aus …`, 'info')
        return
      }
    }
    const atk = enemy.atk * (enraged ? 1.3 : 1)
    const hits = enemy.trait === 'multi' ? 3 : 1
    const power = charge === 1 ? 2.2 : enemy.trait === 'multi' ? 0.42 : 1
    const magic = enemy.trait === 'mimic' && enemyTurns % 2 === 0
    charge = 0
    let total = 0
    for (let i = 0; i < hits; i++) {
      const base = magic ? Math.max(atk * 1.3, st.mag * 1.8) : atk
      let d = base * power * vary() - st.def * (hits > 1 ? 0.75 : 1)
      if (shield > 0) d *= 0.5
      total += Math.max(1, Math.round(d))
    }
    if (counter) {
      counter = false
      const back = Math.round(total * 0.6)
      total = Math.round(total * 0.5)
      ehp -= back
      hp -= total
      log('enemy', `${enemy.name} trifft deinen Konter: Du nimmst ${total}, er nimmt ${back}.`, 'hit')
    } else {
      hp -= total
      const how = magic ? 'kopiert deine Magie' : hits > 1 ? `greift ${hits}× an` : power > 1 ? 'schlägt mit voller Wucht zu' : 'greift an'
      log('enemy', `${enemy.name} ${how}: ${total} Schaden.`, 'hit')
    }
    if (shield > 0) shield--
    if (enemy.trait === 'slow' && rnd() < 0.25) {
      skip = true
      log('enemy', 'Eisige Kälte lähmt dich.', 'info')
    }
    if (enemy.trait === 'bind' && rnd() < 0.2) {
      skip = true
      log('enemy', 'Ketten schlingen sich um dich.', 'info')
    }
    if (enemy.trait === 'drain') {
      mana -= Math.round(mana * 0.1)
      stamina -= Math.round(stamina * 0.1)
      ehp = Math.min(enemy.hp, ehp + Math.round(enemy.hp * 0.02))
    }
  }

  log('info', `${enemy.name}, ${enemy.title}, stellt sich dir entgegen.`, 'info')
  let round = 0
  const heroFirst = st.spd >= enemy.spd
  while (round < MAX_ROUNDS && hp > 0 && ehp > 0) {
    round++
    if (regen > 0) {
      const amount = Math.round(st.hp * 0.08)
      hp = Math.min(st.hp, hp + amount)
      regen--
    }
    const actions = heroFirst ? ['hero', 'enemy'] : ['enemy', 'hero']
    for (const a of actions) {
      if (hp <= 0 || ehp <= 0) break
      if (a === 'hero') {
        heroAct()
        if (haste && ehp > 0) {
          haste = false
          heroAct()
        }
      } else enemyAct()
    }
    mana = Math.min(st.mana, mana + st.mana * 0.05)
    stamina = Math.min(st.stamina, stamina + st.stamina * 0.06)
  }
  const win = ehp <= 0 && hp > 0
  if (win) log('info', `${enemy.name} ist besiegt!`, 'info')
  else if (hp <= 0) log('info', 'Du gehst zu Boden.', 'info')
  else log('info', 'Erschöpft brichst du den Kampf ab.', 'info')
  return {
    win,
    rounds: round,
    usedHeal: Math.max(0, potionsUsed - st.potions),
    usedMana: hero.extraMana - manaPotions,
    events,
    heroMax: st.hp,
    enemyMax: enemy.hp,
  }
}

/* ---------- Kampftickets ---------- */

export const STARTER_TICKETS = 3

/** Tickets kommen aus dem echten Leben: perfekte Tage und Trainings */
export function ticketsEarned(perfectDays: number, trainings: number) {
  return STARTER_TICKETS + perfectDays + trainings
}
