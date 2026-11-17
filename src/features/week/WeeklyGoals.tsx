import { BookOpen, Dumbbell, GraduationCap } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, ProgressBar, Spinner } from '../../components/ui'
import { ratio } from '../../domain/weekly'
import { cx } from '../../lib/cx'
import { fmt, weekdayShort, type DateStr } from '../../lib/dates'
import { formatHM, formatHours } from '../../lib/duration'
import type { WeekGoals } from './useWeekGoals'

export function WeeklyGoals({
  goals,
  days,
  today,
  onOpenDay,
}: {
  goals: WeekGoals | undefined
  days: DateStr[]
  today: DateStr
  onOpenDay: (day: DateStr) => void
}) {
  if (!goals) {
    return (
      <Card title="Wochenziele">
        <Spinner />
      </Card>
    )
  }
  const { training, reading, study } = goals

  return (
    <Card title="Wochenziele" action={<span className="text-xs text-zinc-500">Eintragen: Tag antippen</span>}>
      <div className="space-y-5">
        {/* Training */}
        <GoalBlock
          icon={<Dumbbell className="size-4 text-sky-400" />}
          title="Training"
          value={
            <>
              {training.done}/{training.target}
              {training.extra > 0 && <span className="ml-1 text-amber-300">+{training.extra}</span>}
            </>
          }
          progress={ratio(training.done, training.target)}
          detail={
            <div className="flex flex-wrap gap-1.5">
              {training.perType.map((p) => (
                <span
                  key={p.typeId}
                  className={cx(
                    'rounded-full px-2 py-0.5 text-xs tabular-nums',
                    p.done >= p.target ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-800 text-zinc-300',
                  )}
                >
                  {goals.typeName(p.typeId)} {Math.min(p.done, p.target)}/{p.target}
                  {p.extra > 0 && <span className="text-amber-300"> +{p.extra}</span>}
                </span>
              ))}
              {training.perType.length === 0 && (
                <span className="text-xs text-zinc-500">Kein Trainingsplan für diese Woche.</span>
              )}
            </div>
          }
          days={days}
          today={today}
          onOpenDay={onOpenDay}
          cell={(d) => {
            const sessions = training.sessionsByDay.get(d) ?? []
            if (sessions.length === 0) return null
            return (
              <span className="flex flex-wrap justify-center gap-0.5">
                {sessions.map((s) => (
                  <span key={s.id} className="rounded bg-sky-500/20 px-1 text-[10px] font-medium text-sky-200">
                    {goals.typeName(s.typeId).slice(0, 1)}
                  </span>
                ))}
              </span>
            )
          }}
        />

        {/* Lernen */}
        <GoalBlock
          icon={<GraduationCap className="size-4 text-violet-400" />}
          title="Lernen"
          value={
            <>
              {formatHM(study.minutes)} <span className="text-zinc-500">/ {formatHours(study.target)} h</span>
            </>
          }
          progress={ratio(study.minutes, study.target)}
          detail={
            study.byModule.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {study.byModule.map((m) => (
                  <span key={m.moduleId ?? 'general'} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                    {m.name} <span className="tabular-nums text-zinc-400">{formatHM(m.minutes)}</span>
                  </span>
                ))}
              </div>
            ) : null
          }
          days={days}
          today={today}
          onOpenDay={onOpenDay}
          cell={(d) => {
            const m = study.byDay.get(d) ?? 0
            return m > 0 ? <span className="text-violet-200">{formatHM(m)}</span> : null
          }}
        />

        {/* Lesen */}
        <GoalBlock
          icon={<BookOpen className="size-4 text-amber-400" />}
          title="Lesen"
          value={
            <>
              {reading.minutes} <span className="text-zinc-500">/ {reading.target} min</span>
            </>
          }
          progress={ratio(reading.minutes, reading.target)}
          days={days}
          today={today}
          onOpenDay={onOpenDay}
          cell={(d) => {
            const m = reading.byDay.get(d) ?? 0
            return m > 0 ? <span className="text-amber-200">{m}′</span> : null
          }}
        />
      </div>
    </Card>
  )
}

function GoalBlock({
  icon,
  title,
  value,
  progress,
  detail,
  days,
  today,
  onOpenDay,
  cell,
}: {
  icon: ReactNode
  title: string
  value: ReactNode
  progress: number
  detail?: ReactNode
  days: DateStr[]
  today: DateStr
  onOpenDay: (day: DateStr) => void
  cell: (day: DateStr) => ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          {icon}
          {title}
        </div>
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      </div>
      <ProgressBar value={progress} />
      {detail}
      <DayStrip days={days} today={today} onOpenDay={onOpenDay} cell={cell} />
    </div>
  )
}

/** Kompakte Tageszeile Mo–So; Antippen öffnet den Tag. */
export function DayStrip({
  days,
  today,
  onOpenDay,
  cell,
}: {
  days: DateStr[]
  today: DateStr
  onOpenDay: (day: DateStr) => void
  cell: (day: DateStr) => ReactNode
}) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((d) => {
        const content = cell(d)
        return (
          <button
            key={d}
            type="button"
            onClick={() => onOpenDay(d)}
            aria-label={`${fmt(d, 'EEEE, d. MMMM')} öffnen`}
            className={cx(
              'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-xs tabular-nums transition-colors',
              d === today ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-zinc-950/50 hover:bg-zinc-800',
            )}
          >
            <span className={cx('text-[10px]', d === today ? 'text-emerald-300' : 'text-zinc-500')}>{weekdayShort(d)}</span>
            {content ?? <span className="text-zinc-700">–</span>}
          </button>
        )
      })}
    </div>
  )
}
