import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { habitsRepo } from '../../data'
import { dayCompletion } from '../../domain/habits'
import { addDaysStr, fmt, isoWeek, type DateStr } from '../../lib/dates'
import { useToday } from '../../lib/useToday'
import { CheckCircle, IconButton, ProgressBar, Spinner } from '../../components/ui'
import { cx } from '../../lib/cx'
import { habitsActiveOn, useHabitData } from '../week/useHabitData'
import { DayProject, DayReading, DayStudy, DayTraining } from './DaySections'
import { useDayPanel } from './useDayPanel'

/** Tages-Details: am Handy als Sheet von unten, am Laptop als Seitenleiste. */
export function DayPanel() {
  const { day, show, close } = useDayPanel()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!day) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [day, close])

  // Fokus ins Panel, wenn es aufgeht
  const isOpen = day != null
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (!day) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade absolute inset-0 bg-black/60" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Tag ${fmt(day, 'EEEE, d. MMMM')}`}
        tabIndex={-1}
        className={cx(
          'animate-sheet absolute flex flex-col bg-zinc-900 shadow-2xl outline-none',
          'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t border-zinc-800',
          'md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[420px] md:rounded-none md:border-l md:border-t-0',
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-zinc-700 md:hidden" aria-hidden="true" />
        <DayHeader day={day} onPrev={() => show(addDaysStr(day, -1))} onNext={() => show(addDaysStr(day, 1))} onClose={close} />
        <DayBody day={day} />
      </div>
    </div>
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
    <div className="pb-safe flex-1 space-y-6 overflow-y-auto px-4 pb-8">
      {isFuture && (
        <p className="rounded-lg bg-zinc-950/60 px-3 py-2 text-xs text-zinc-400">
          Dieser Tag liegt in der Zukunft – Einträge sind erst ab dem Tag selbst möglich.
        </p>
      )}
      <DayHabits day={day} />
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
        <p className="rounded-xl bg-zinc-950/50 p-4 text-sm text-zinc-400">
          An diesem Tag war noch keine Gewohnheit aktiv.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
          {habits.map((h) => {
            const checked = data.done.has(h.id, day)
            const toggle = () => void habitsRepo.setHabitDone(h.id, day, !checked)
            return (
              <li key={h.id}>
                <div
                  className={cx(
                    'flex items-center gap-3 px-3 py-2.5',
                    !isFuture && 'cursor-pointer hover:bg-zinc-800/50',
                  )}
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
