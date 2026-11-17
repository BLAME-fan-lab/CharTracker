import { ChevronLeft, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { Card, Spinner } from '../../components/ui'
import { useSettings } from '../../data'
import { CATEGORY_NAMES, evaluateAchievements, type AchievementCategory } from '../../domain/achievements'
import { useToday } from '../../lib/useToday'
import { useCharacter } from './useCharacter'
import { AchievementGrid } from './visuals'

export function AchievementsPage() {
  const today = useToday()
  const sheet = useCharacter(today)
  const settings = useSettings()
  const back = (
    <Link to="/charakter" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
      <ChevronLeft className="size-4" /> Charakter
    </Link>
  )
  if (!sheet || !settings) return <div className="space-y-4">{back}<Spinner /></div>

  const states = evaluateAchievements(sheet.stats)
  const unlocked = states.filter((s) => s.unlocked).length
  const dates = settings.achievementDates ?? {}
  const categories = Object.keys(CATEGORY_NAMES) as AchievementCategory[]

  return (
    <div className="space-y-4">
      {back}
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-500/30">
          <Trophy className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Errungenschaften</h1>
          <p className="text-sm text-zinc-400">
            {unlocked} von {states.length} erreicht
          </p>
        </div>
      </div>
      {categories.map((c) => {
        const items = states
          .filter((s) => s.achievement.category === c)
          .sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
        return (
          <Card key={c} title={`${CATEGORY_NAMES[c]} · ${items.filter((i) => i.unlocked).length}/${items.length}`}>
            <AchievementGrid items={items} dates={dates} />
          </Card>
        )
      })}
    </div>
  )
}
