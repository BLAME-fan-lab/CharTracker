import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { CheckCircle, IconButton, ProgressBar, Spinner } from '../../components/ui'
import { Sheet } from '../../components/Sheet'
import { habitsRepo } from '../../data'
import { dayCompletion } from '../../domain/habits'
import { cx } from '../../lib/cx'
import { addDaysStr, fmt, isoWeek, type DateStr } from '../../lib/dates'
import { useToday } from '../../lib/useToday'
import { DayTodos } from '../todos/DayTodos'
import { habitsActiveOn, useHabitData } from '../week/useHabitData'
import { DayProject, DayReading, DayStudy, DayTraining } from './DaySections'
import { useDayPanel } from './useDayPanel'

/** Tages-Details: am Handy als Sheet von unten, am Laptop als Seitenleiste. */
export function DayPanel() {
  const { day, show, close } = useDayPanel()
  if (!day) return null
  return (
    <Sheet
      label={`Tag ${fmt(day, 'EEEE, d. MMMM')}`}
      onClose={close}
      header={
        <DayHeader day={day} onPrev={() => show(addDaysStr(day, -1))} onNext={() => show(addDaysStr(day, 1))} onClose={close} />
      }
    >
      <DayBody day={day} />
    </Sheet>
  )
}

function DayHeader({ day, onPrev, onNext, onClose }: {
  day: DateStr
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}) {
  const today = useToday()
  const relative =
    day === today ? 'Heute' : day === addDaysStr(today, -1) ? 'Gestern' : day === addDaysStr(today, 1) ? 'Morgen' : null
  return (
    <header className="flex items-center gap-1 px-2 py-3">
      <IconButton label="Vorheriger Tag" onClick={onPrev}>
        <ChevronLeft className="size-5" />
      </IconButton>
      <div className="min-w-0 flex-1 text-center">
        <h2 className="truncate text-base font-semibold">{fmt(day, 'EEEE, d. MMMM')}</h2>
        <p className="text-xs text-zinc-400">
          KW {isoWeek(day)}
          {relative && <span className="text-emerald-400"> · {relative}</span>}
        </p>
      </div>
      <IconButton label="Nächster Tag" onClick={onNext}>
        <ChevronRight className="size-5" />
      </IconButton>
      <IconButton label="Schließen" onClick={onClose}>
        <X className="size-5" />
      </IconButton>
    </header>
  )
}

function DayBody({ day }: { day: DateStr }) {
  const today = useToday()
  const isFuture = day > today
  return (
    <div className="space-y-6">
      {isFuture && (
        <p className="rounded-lg bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400">
          Dieser Tag liegt in der Zukunft. To-dos kannst du schon planen, Haken und Zeiten erst am Tag selbst eintragen.
        </p>
      )}
      <DayHabits day={day} />
      <DayTodos day={day} />
      <DayTraining day={day} disabled={isFuture} />
      <DayStudy day={day} disabled={isFuture} />
      <DayReading day={day} disabled={isFuture} />
      <DayProject day={day} disabled={isFuture} />
    </div>
  )
}

function DayHabits({ day }: { day: DateStr }) {
  const data = useHabitData()
  const today = useToday()
  if (!data) return <Spinner />

  const habits = habitsActiveOn(data.habits, day)
  const completion = dayCompletion(habits, data.done, day)
  const isFuture = day > today

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Tägliche Ziele</h3>
        {completion.active > 0 && (
          <span className="text-sm tabular-nums text-zinc-400">
            {completion.done}/{completion.active}
          </span>
        )}
      </div>
      {completion.ratio != null && <ProgressBar value={completion.ratio} />}

      {habits.length === 0 ? (
        <p className="rounded-xl bg-zinc-950/50 p-4 text-sm text-zinc-400">An diesem Tag war noch keine Gewohnheit aktiv.</p>
      ) : (
        <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
          {habits.map((h) => {
            const checked = data.done.has(h.id, day)
            const toggle = () => void habitsRepo.setHabitDone(h.id, day, !checked)
            return (
              <li key={h.id}>
                <div
                  className={cx('flex items-center gap-3 px-3 py-2.5', !isFuture && 'cursor-pointer hover:bg-zinc-800/50')}
                  onClick={isFuture ? undefined : toggle}
                >
                  <span className={cx('flex-1 text-sm', checked ? 'text-zinc-100' : 'text-zinc-300')}>{h.name}</span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <CheckCircle checked={checked} disabled={isFuture} onToggle={toggle} label={h.name} size="lg" />
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
