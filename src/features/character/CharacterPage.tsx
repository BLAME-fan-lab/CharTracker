import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { Spinner } from '../../components/ui'
import { displayLevel, MAX_LEVEL } from '../../domain/character'
import { SKILL_NAMES, type SkillResult } from '../../domain/characterSheet'
import { cx } from '../../lib/cx'
import { useToday } from '../../lib/useToday'
import { SKILL_COLOR, SKILL_ICON } from './skillMeta'
import { useCharacter } from './useCharacter'

export function CharacterPage() {
  const today = useToday()
  const sheet = useCharacter(today)

  if (!sheet) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Charakter</h1>
        <Spinner />
      </div>
    )
  }

  const level = displayLevel(sheet.level)
  const ringPct = (sheet.level / MAX_LEVEL) * 100

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Charakter</h1>

      <section className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
        <div
          className="relative grid size-28 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(#34d399 ${ringPct}%, #27272a ${ringPct}% 100%)` }}
          role="img"
          aria-label={`Charakterlevel ${level} von 1000`}
        >
          <div className="grid size-[5.9rem] place-items-center rounded-full bg-zinc-950">
            <div className="text-center leading-none">
              <div className="text-3xl font-bold tabular-nums">{level}</div>
              <div className="mt-1 text-[10px] tracking-widest text-zinc-500 uppercase">von 1000</div>
            </div>
          </div>
        </div>
        <div className="min-w-0 space-y-1 text-sm">
          <div className="text-xs tracking-wide text-zinc-400 uppercase">Charakterlevel</div>
          <p className="text-zinc-300">Durchschnitt deiner 7 Skill-Bäume.</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
            {sheet.age != null && <span>{sheet.age} Jahre</span>}
            {sheet.weightKg != null && <span>{sheet.weightKg.toLocaleString('de-DE')} kg</span>}
            {sheet.bmi != null && <span>BMI {sheet.bmi.toLocaleString('de-DE', { maximumFractionDigits: 1 })}</span>}
            {sheet.age == null && (
              <Link to="/charakter/health" className="text-emerald-300 underline underline-offset-2">
                Profil ausfüllen
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sheet.skills.map((s) => (
          <SkillCard key={s.key} skill={s} />
        ))}
      </div>

      <p className="px-1 text-xs leading-relaxed text-zinc-500">
        Jeder Baum misst dein Können auf einer realistischen Skala von 0 bis 1000. 1000 ist praktisch nicht erreichbar.
        Tippe einen Baum an, um zu sehen, wie er berechnet wird, und um Werte einzutragen.
      </p>
    </div>
  )
}

function SkillCard({ skill }: { skill: SkillResult }) {
  const color = SKILL_COLOR[skill.key]
  const level = displayLevel(skill.level)
  return (
    <Link
      to={`/charakter/${skill.key}`}
      className="block min-w-0 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 transition-colors hover:border-zinc-700 sm:p-4"
    >
      <div className="flex items-center gap-3">
        <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-950 ring-1', color.text, color.ring)}>
          {SKILL_ICON[skill.key]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-semibold">{SKILL_NAMES[skill.key]}</span>
            <span className={cx('text-lg font-bold tabular-nums', color.text)}>{level}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className={cx('h-full rounded-full', color.bar)} style={{ width: `${(skill.level / MAX_LEVEL) * 100}%` }} />
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-zinc-600" />
      </div>
      <p className="mt-2 truncate text-xs text-zinc-400">
        {skill.hint ?? skill.details.slice(0, 2).map((d) => `${d.label}: ${d.value}`).join(' · ')}
      </p>
    </Link>
  )
}
