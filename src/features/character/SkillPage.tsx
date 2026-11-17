import { ChevronLeft, Info } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Card, Spinner } from '../../components/ui'
import { displayLevel, MAX_LEVEL } from '../../domain/character'
import { SKILL_NAMES, SKILL_ORDER, type SkillKey } from '../../domain/characterSheet'
import { cx } from '../../lib/cx'
import { useToday } from '../../lib/useToday'
import { AcademicEditor } from './editors/AcademicEditor'
import { HabitSkillInfo } from './editors/HabitSkillInfo'
import { HealthEditor } from './editors/HealthEditor'
import { MusicEditor } from './editors/MusicEditor'
import { ProjectEditor } from './editors/ProjectEditor'
import { ReadingEditor } from './editors/ReadingEditor'
import { SportEditor } from './editors/SportEditor'
import { SKILL_COLOR, SKILL_ICON, SKILL_RULES } from './skillMeta'
import { useCharacter } from './useCharacter'

export function SkillPage() {
  const { skill } = useParams()
  const today = useToday()
  const sheet = useCharacter(today)
  const key = SKILL_ORDER.includes(skill as SkillKey) ? (skill as SkillKey) : null

  const back = (
    <Link to="/charakter" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
      <ChevronLeft className="size-4" /> Charakter
    </Link>
  )
  if (!key) return <div className="space-y-4">{back}<p className="text-sm text-zinc-400">Unbekannter Bereich.</p></div>
  if (!sheet) return <div className="space-y-4">{back}<Spinner /></div>

  const result = sheet.skills.find((s) => s.key === key)!
  const color = SKILL_COLOR[key]

  return (
    <div className="space-y-4">
      {back}
      <div className="flex items-center gap-3">
        <span className={cx('grid size-12 place-items-center rounded-2xl bg-zinc-900 ring-1', color.text, color.ring)}>
          {SKILL_ICON[key]}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{SKILL_NAMES[key]}</h1>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className={cx('h-full rounded-full', color.bar)} style={{ width: `${(result.level / MAX_LEVEL) * 100}%` }} />
          </div>
        </div>
        <div className="text-right">
          <div className={cx('text-3xl font-bold tabular-nums', color.text)}>{displayLevel(result.level)}</div>
          <div className="text-[10px] tracking-widest text-zinc-500 uppercase">von 1000</div>
        </div>
      </div>

      <Card>
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {result.details.map((d) => (
            <div key={d.label} className="min-w-0">
              <dt className="text-xs text-zinc-500">{d.label}</dt>
              <dd className="text-sm break-words text-zinc-100">{d.value}</dd>
            </div>
          ))}
        </dl>
        {result.hint && <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{result.hint}</p>}
        <p className="mt-3 flex gap-2 border-t border-zinc-800 pt-3 text-xs leading-relaxed text-zinc-400">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {SKILL_RULES[key]}
        </p>
      </Card>

      {key === 'academic' && <AcademicEditor />}
      {key === 'sport' && <SportEditor today={today} />}
      {key === 'health' && <HealthEditor today={today} />}
      {key === 'hygiene' && <HabitSkillInfo skill="hygiene" />}
      {key === 'reading' && <ReadingEditor today={today} />}
      {key === 'music' && <MusicEditor />}
      {key === 'project' && <ProjectEditor today={today} />}
    </div>
  )
}
