import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button, Card, IconButton, Spinner } from '../../components/ui'
import {
  useAllModules,
  useReadingLogs,
  useStudyLogs,
  useStudyUnits,
  useTodos,
  useTrainingSessions,
} from '../../data'
import { dayCompletion } from '../../domain/habits'
import { cx } from '../../lib/cx'
import {
  addDaysStr,
  addMonthsStr,
  daysInRange,
  fmt,
  isValidMonthStr,
  monthEnd,
  monthOf,
  monthStart,
  weekStartOf,
  type DateStr,
} from '../../lib/dates'
import { formatHM } from '../../lib/duration'
import { useToday } from '../../lib/useToday'
import { OverviewHeader } from '../OverviewHeader'
import { useDayPanel } from '../day/useDayPanel'
import { useHabitData } from '../week/useHabitData'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** Heatmap-Stufe 0–5 für den Erfüllungsgrad (null = nicht bewertet). */
function heatClass(ratio: number | null): string {
  if (ratio == null) return 'bg-zinc-900/40 text-zinc-500'
  if (ratio === 0) return 'bg-zinc-800 text-zinc-300'
  if (ratio < 0.4) return 'bg-emerald-950 text-emerald-200'
  if (ratio < 0.7) return 'bg-emerald-800 text-emerald-50'
  if (ratio < 1) return 'bg-emerald-600 text-white'
  return 'bg-emerald-400 text-zinc-950'
}

interface DayEvent {
  date: DateStr
  kind: 'exam' | 'due'
  label: string
}

export function MonthPage() {
  const today = useToday()
  const [params, setParams] = useSearchParams()
  const raw = params.get('m')
  const month = isValidMonthStr(raw) ? raw : monthOf(today)
  const isCurrent = month === monthOf(today)
  const { open } = useDayPanel()

  const from = monthStart(month)
  const to = monthEnd(month)
  const cells = daysInRange(weekStartOf(from), addDaysStr(weekStartOf(to), 6))

  const habitData = useHabitData()
  const study = useStudyLogs(from, to)
  const reading = useReadingLogs(from, to)
  const training = useTrainingSessions(from, to)
  const modules = useAllModules()
  const units = useStudyUnits()
  const todos = useTodos()

  const events = (() => {
    const map = new Map<DateStr, DayEvent[]>()
    if (!modules || !units) return map
    const add = (e: DayEvent) => map.set(e.date, [...(map.get(e.date) ?? []), e])
    for (const m of modules) {
      if (!m.archived && m.examDate && m.examDate >= from && m.examDate <= to) {
        add({ date: m.examDate, kind: 'exam', label: `Klausur ${m.shortName || m.name}${m.examTime ? `, ${m.examTime} Uhr` : ''}` })
      }
    }
    for (const u of units) {
      if (u.dueDate && !u.doneDate && u.dueDate >= from && u.dueDate <= to) {
        const mod = modules.find((m) => m.id === u.moduleId)
        add({ date: u.dueDate, kind: 'due', label: `${mod ? `${mod.shortName}: ` : ''}${u.title}` })
      }
    }
    return map
  })()

  const goTo = (m: string | null) => {
    const next = new URLSearchParams(params)
    if (m == null || m === monthOf(today)) next.delete('m')
    else next.set('m', m)
    setParams(next, { replace: true })
  }

  if (!habitData || !study || !reading || !training) {
    return (
      <div className="space-y-4">
        <OverviewHeader mode="month" focus={isCurrent ? today : from} />
        <Spinner />
      </div>
    )
  }

  const ratioOf = (d: DateStr) => (d > today ? null : dayCompletion(habitData.habits, habitData.done, d).ratio)

  // Monatsstatistik (bis heute)
  const pastDays = daysInRange(from, to < today ? to : today)
  const ratios = pastDays.map(ratioOf).filter((r): r is number => r != null)
  const avg = ratios.length ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) : null
  const perfect = ratios.filter((r) => r === 1).length
  const studyTotal = study.reduce((a, s) => a + s.minutes, 0)
  const readingTotal = reading.reduce((a, r) => a + r.minutes, 0)
  const eventList = [...events.values()].flat().sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-4">
      <OverviewHeader mode="month" focus={isCurrent ? today : from} />

      <div className="flex items-center gap-1">
        <IconButton label="Vorheriger Monat" onClick={() => goTo(addMonthsStr(month, -1))}>
          <ChevronLeft className="size-5" />
        </IconButton>
        <div className="min-w-0 flex-1 text-center text-lg font-semibold">{fmt(from, 'MMMM yyyy')}</div>
        <IconButton label="Nächster Monat" onClick={() => goTo(addMonthsStr(month, 1))}>
          <ChevronRight className="size-5" />
        </IconButton>
        <Button variant={isCurrent ? 'ghost' : 'secondary'} disabled={isCurrent} onClick={() => goTo(null)}>
          Heute
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-center text-xs text-zinc-500">
              {w}
            </div>
          ))}
          {cells.map((d) => {
            const inMonth = d >= from && d <= to
            const r = inMonth ? ratioOf(d) : null
            const dayEvents = events.get(d) ?? []
            const hasExam = dayEvents.some((e) => e.kind === 'exam')
            const hasDue = dayEvents.some((e) => e.kind === 'due')
            const openTodos = inMonth ? (todos ?? []).filter((t) => t.dueDate === d && !t.doneDate).length : 0
            const pct = r == null ? null : Math.round(r * 100)
            return (
              <button
                key={d}
                type="button"
                onClick={() => open(d)}
                aria-label={`${fmt(d, 'EEEE, d. MMMM')}${pct != null ? `, ${pct} % erfüllt` : ''}${dayEvents.map((e) => `, ${e.label}`).join('')}${openTodos > 0 ? `, ${openTodos} offene To-dos` : ''}`}
                className={cx(
                  'relative flex aspect-square flex-col items-start justify-between rounded-lg p-1 text-left transition-transform hover:scale-[1.04] sm:p-1.5',
                  inMonth ? heatClass(r) : 'bg-transparent text-zinc-700',
                  d === today && 'ring-2 ring-emerald-300 ring-offset-1 ring-offset-zinc-900',
                  hasExam && 'outline outline-2 -outline-offset-2 outline-rose-400',
                )}
              >
                <span className="text-xs font-medium tabular-nums sm:text-sm">{fmt(d, 'd')}</span>
                <span className="flex w-full items-end justify-between gap-0.5">
                  {pct != null ? (
                    <span className="hidden text-[10px] tabular-nums opacity-80 sm:inline">{pct} %</span>
                  ) : (
                    <span />
                  )}
                  <span className="flex items-center gap-0.5">
                    {openTodos > 0 && <span className="size-1.5 rounded-full bg-sky-400" title={`${openTodos} To-do(s)`} />}
                    {hasDue && <span className="size-1.5 rounded-full bg-amber-400" />}
                    {hasExam && <GraduationCap className="size-3.5 text-rose-300" />}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            0 %
            {[0, 0.2, 0.5, 0.8, 1].map((v) => (
              <span key={v} className={cx('size-3.5 rounded', heatClass(v))} />
            ))}
            100 %
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="size-3.5 text-rose-300" /> Klausur
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-400" /> Abgabe
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-sky-400" /> To-do
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Ø Tagesziele" value={avg != null ? `${avg} %` : '–'} />
        <MiniStat label="Perfekte Tage" value={String(perfect)} />
        <MiniStat label="Lernzeit" value={`${formatHM(studyTotal)} h`} />
        <MiniStat label="Training · Lesen" value={`${training.length}× · ${readingTotal} min`} />
      </div>

      <Card title="Klausuren und Abgaben">
        {eventList.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Keine in diesem Monat. Klausurtermine und Lerneinheiten trägst du im Uni-Bereich ein (Phase 4).
          </p>
        ) : (
          <ul className="space-y-1.5">
            {eventList.map((e, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => open(e.date)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-zinc-800"
                >
                  <span className="w-16 shrink-0 text-xs tabular-nums text-zinc-400">{fmt(e.date, 'EE dd.MM.')}</span>
                  {e.kind === 'exam' ? (
                    <GraduationCap className="size-4 shrink-0 text-rose-300" />
                  ) : (
                    <span className="mx-1 size-2 shrink-0 rounded-full bg-amber-400" />
                  )}
                  <span className="min-w-0 truncate">{e.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-3 py-2.5">
      <div className="truncate text-xs text-zinc-400">{label}</div>
      <div className="mt-0.5 truncate text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}
