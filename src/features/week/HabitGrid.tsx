import { Flame } from 'lucide-react'
import { Fragment } from 'react'
import { habitsRepo, type Habit } from '../../data'
import { bestHabitStreak, dayCompletion, habitStreak, isHabitActiveOn } from '../../domain/habits'
import { fmt, weekdayShort, type DateStr } from '../../lib/dates'
import { CheckCircle } from '../../components/ui'
import { cx } from '../../lib/cx'
import type { HabitData } from './useHabitData'

/**
 * Abhak-Raster: Zeilen = Gewohnheiten, Spalten = Mo–So.
 * Am Handy steht der Name über der Zeile, ab sm links daneben.
 */
export function HabitGrid({
  days,
  habits,
  data,
  today,
  onOpenDay,
  emptyHint,
}: {
  days: DateStr[]
  habits: Habit[]
  data: HabitData
  today: DateStr
  onOpenDay: (day: DateStr) => void
  emptyHint: string
}) {
  if (habits.length === 0) {
    return <p className="text-sm text-zinc-400">{emptyHint}</p>
  }

  return (
    <div className="grid grid-cols-7 items-center gap-x-1 sm:grid-cols-[minmax(0,1fr)_repeat(7,3rem)]">
      {/* Kopfzeile */}
      <div className="hidden sm:block" />
      {days.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onOpenDay(d)}
          className={cx(
            'mb-1 flex flex-col items-center rounded-lg py-1 text-xs transition-colors hover:bg-zinc-800',
            d === today ? 'bg-emerald-500/15 text-emerald-300' : 'text-zinc-400',
          )}
          aria-label={`${fmt(d, 'EEEE, d. MMMM')} öffnen`}
        >
          <span className="font-medium">{weekdayShort(d)}</span>
          <span className={cx('tabular-nums', d === today ? 'font-semibold' : 'text-zinc-500')}>{fmt(d, 'd.')}</span>
        </button>
      ))}

      {/* Gewohnheiten */}
      {habits.map((h) => {
        const streak = habitStreak(h, data.done, today)
        const best = bestHabitStreak(h, data.done, today)
        return (
          <Fragment key={h.id}>
            <div className="col-span-7 flex min-w-0 items-center gap-2 pt-2.5 pb-1 sm:col-span-1 sm:py-1.5 sm:pr-2">
              <span className="truncate text-sm text-zinc-200" title={h.name}>
                {h.name}
              </span>
              <StreakBadge streak={streak} best={best} />
            </div>
            {days.map((d) => {
              const active = isHabitActiveOn(h, d)
              const checked = data.done.has(h.id, d)
              return (
                <div key={d} className={cx('flex justify-center py-0.5', d === today && 'rounded-md bg-emerald-500/5')}>
                  {active ? (
                    <CheckCircle
                      checked={checked}
                      disabled={d > today}
                      onToggle={() => void habitsRepo.setHabitDone(h.id, d, !checked)}
                      label={`${h.name} – ${fmt(d, 'EEEE, d. MMMM')}`}
                    />
                  ) : (
                    <span className="size-8 text-center leading-8 text-zinc-700" aria-hidden="true">
                      ·
                    </span>
                  )}
                </div>
              )
            })}
          </Fragment>
        )
      })}

      {/* Erfüllungsgrad pro Tag */}
      <div className="col-span-7 mt-3 border-t border-zinc-800 pt-2 text-xs text-zinc-500 sm:col-span-1 sm:mt-2">
        Erfüllt
      </div>
      {days.map((d) => {
        const c = dayCompletion(habits, data.done, d)
        const pct = c.ratio == null || d > today ? null : Math.round(c.ratio * 100)
        return (
          <div
            key={d}
            className={cx(
              'text-center text-xs tabular-nums sm:mt-2 sm:border-t sm:border-zinc-800 sm:pt-2',
              pct === 100 ? 'font-semibold text-emerald-400' : pct != null && pct >= 50 ? 'text-zinc-300' : 'text-zinc-500',
            )}
          >
            {pct == null ? '–' : `${pct} %`}
          </div>
        )
      })}
    </div>
  )
}

function StreakBadge({ streak, best }: { streak: number; best: number }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs tabular-nums',
        streak > 0 ? 'bg-amber-500/15 text-amber-300' : 'bg-zinc-800 text-zinc-500',
      )}
      title={`${streak} ${streak === 1 ? 'Tag' : 'Tage'} am Stück · Rekord: ${best}`}
    >
      <Flame className="size-3" />
      {streak}
    </span>
  )
}
