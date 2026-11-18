import { BookOpen, ChevronRight, DoorOpen, Lock, Swords, Ticket, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Card, Spinner } from '../../components/ui'
import { useSettings } from '../../data'
import { evaluateAchievements } from '../../domain/achievements'
import { displayLevel, MAX_LEVEL } from '../../domain/character'
import { SKILL_NAMES, type CharacterSheet, type SkillResult } from '../../domain/characterSheet'
import { cx } from '../../lib/cx'
import { useParamSheet } from '../../lib/useParamSheet'
import { useToday } from '../../lib/useToday'
import { AvatarInventory, AvatarStage } from './AvatarSection'
import { CombatBook } from './combat/CombatBook'
import { useCombat } from './combat/useCombat'
import { SKILL_COLOR, SKILL_ICON } from './skillMeta'
import { useCharacter } from './useCharacter'
import { NextRankText, RankBadge, SkillRadar } from './visuals'

export function CharacterPage() {
  const today = useToday()
  const sheet = useCharacter(today)
  const [preview, setPreview] = useState(false)
  const combat = useCombat(sheet)
  const book = useParamSheet('buch')
  const bookKind = book.value === 'zauber' || book.value === 'technik' ? book.value : null

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

      <section className="overflow-hidden rounded-2xl border border-zinc-800/80">
        <AvatarStage level={sheet.level} preview={preview} onPreview={setPreview} onBook={(k) => book.open(k)} />
        <nav className="grid grid-cols-3 border-t border-zinc-800 bg-black font-mono text-[11px] tracking-wider uppercase" aria-label="Kampf">
          <button type="button" onClick={() => book.open('zauber')} className="flex items-center justify-center gap-1.5 py-2.5 text-zinc-300 hover:bg-zinc-900 hover:text-white">
            <BookOpen className="size-3.5" /> Zauber
          </button>
          <button
            type="button"
            onClick={() => book.open('technik')}
            className="flex items-center justify-center gap-1.5 border-x border-zinc-800 py-2.5 text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            <Swords className="size-3.5" /> Techniken
          </button>
          <Link to="/charakter/turm" className="flex items-center justify-center gap-1.5 py-2.5 text-zinc-300 hover:bg-zinc-900 hover:text-white">
            <DoorOpen className="size-3.5" /> Turm
            {combat && combat.tickets > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded bg-zinc-100 px-1 text-[10px] text-black">
                <Ticket className="size-3" />
                {combat.tickets}
              </span>
            )}
          </Link>
        </nav>
        <div className="flex items-center gap-4 border-t border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
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
          <div className="min-w-0 space-y-1.5 text-sm">
            <div className="text-xs tracking-wide text-zinc-400 uppercase">Charakterlevel</div>
            <RankBadge level={sheet.level} size="md" />
            <NextRankText level={sheet.level} className="block text-xs text-zinc-400" />
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
        </div>
      </section>

      <AvatarInventory
        level={sheet.level}
        onPreview={() => {
          setPreview(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      <Card title="Skill-Netz">
        <div className="flex justify-center">
          <SkillRadar skills={sheet.skills} characterLevel={sheet.level} />
        </div>
      </Card>

      <AchievementSummary sheet={sheet} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sheet.skills.map((s) => (
          <SkillCard key={s.key} skill={s} />
        ))}
      </div>

      {bookKind && combat && <CombatBook kind={bookKind} data={combat} onClose={book.close} />}

      <p className="px-1 text-xs leading-relaxed text-zinc-500">
        Jeder Baum misst dein Können auf einer realistischen Skala von 0 bis 1000. 1000 ist praktisch nicht erreichbar.
        Tippe einen Baum an, um zu sehen, wie er berechnet wird, und um Werte einzutragen.
      </p>
    </div>
  )
}

function AchievementSummary({ sheet }: { sheet: CharacterSheet }) {
  const settings = useSettings()
  const states = evaluateAchievements(sheet.stats)
  const dates = settings?.achievementDates ?? {}
  const unlocked = states.filter((s) => s.unlocked)
  const recent = [...unlocked].sort((a, b) => (dates[b.achievement.id] ?? '').localeCompare(dates[a.achievement.id] ?? '')).slice(0, 3)
  const next = states
    .filter((s) => !s.unlocked)
    .sort((a, b) => b.current / b.target - a.current / a.target)
    .slice(0, 2)
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-300" /> Errungenschaften · {unlocked.length}/{states.length}
        </span>
      }
      action={
        <Link to="/charakter/erfolge" className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-200">
          Alle <ChevronRight className="size-3.5" />
        </Link>
      }
    >
      <ul className="space-y-1.5 text-sm">
        {recent.map((s) => (
          <li key={s.achievement.id} className="flex items-center gap-2">
            <Trophy className="size-3.5 shrink-0 text-amber-300" />
            <span className="text-amber-100">{s.achievement.title}</span>
          </li>
        ))}
        {next.map((s) => (
          <li key={s.achievement.id} className="flex items-center gap-2 text-zinc-400">
            <Lock className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{s.achievement.title}</span>
            <span className="text-xs tabular-nums">{Math.round((s.current / s.target) * 100)} %</span>
          </li>
        ))}
      </ul>
    </Card>
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
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-semibold">{SKILL_NAMES[skill.key]}</span>
              <RankBadge level={skill.level} />
            </span>
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
