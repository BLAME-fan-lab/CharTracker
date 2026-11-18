import { useMemo } from 'react'
import { useSettings } from '../../../data'
import type { CombatProgress } from '../../../data/types'
import { avatarState } from '../../../domain/avatar'
import type { CharacterSheet } from '../../../domain/characterSheet'
import { loadout, ticketsEarned, type HeroLoadout, type SkillLevels } from '../../../domain/combat'
import { boostColors, computeBonus, EMPTY_INVENTORY, type Inventory } from '../../../domain/loot'
import { useAvatarPath } from '../useAvatarPath'

export const EMPTY_PROGRESS: CombatProgress = { floor: 0, spent: 0, wins: 0, losses: 0 }

export interface CombatData {
  skills: SkillLevels
  level: number
  hero: HeroLoadout
  progress: CombatProgress
  inventory: Inventory
  /** Leuchtfarben der ausgerüsteten Talismane */
  colors: string[]
  earned: number
  tickets: number
}

/** Alles, was Zauberbuch, Kampftechniken und Turm brauchen – aus dem Charakterbogen abgeleitet */
export function useCombat(sheet: CharacterSheet | undefined): CombatData | undefined {
  const settings = useSettings()
  const path = useAvatarPath()
  return useMemo(() => {
    if (!sheet || !settings) return undefined
    const skills = Object.fromEntries(sheet.skills.map((s) => [s.key, s.level])) as SkillLevels
    const progress = settings.combat ?? EMPTY_PROGRESS
    const inventory = (progress.loot as Inventory | undefined) ?? EMPTY_INVENTORY
    const earned = ticketsEarned(sheet.stats.perfectDays, sheet.stats.trainings)
    return {
      skills,
      level: sheet.level,
      hero: loadout(skills, sheet.level, avatarState(sheet.level).counts, path, {
        bonus: computeBonus(inventory),
        heal: inventory.heal,
        mana: inventory.mana,
      }),
      progress,
      inventory,
      colors: boostColors(inventory),
      earned,
      tickets: Math.max(0, earned - progress.spent),
    }
  }, [sheet, settings, path])
}
