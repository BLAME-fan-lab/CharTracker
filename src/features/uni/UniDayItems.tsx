import { ChevronRight, GraduationCap } from 'lucide-react'
import { Link } from 'react-router'
import { Card, CheckCircle, Spinner } from '../../components/ui'
import { uniRepo, useActiveModules, useStudyUnits, type Module, type StudyUnit } from '../../data'
import { cx } from '../../lib/cx'
import { fmt, type DateStr } from '../../lib/dates'
import { useToday } from '../../lib/useToday'
import { UNIT_TYPE_LABEL } from './format'
import { useUniData } from './useUniData'
import { StatusPill } from './UniParts'

type UniEvent =
  | { kind: 'exam'; date: DateStr; module: Module }
  | { kind: 'unit'; date: DateStr; module: Module | undefined; unit: StudyUnit }

function collectEvents(modules: Module[], units: StudyUnit[], from: DateStr, to: DateStr): UniEvent[] {
  const events: UniEvent[] = []
  for (const m of modules) {
    if (m.examDate && m.examDate >= from && m.examDate <= to) events.push({ kind: 'exam', date: m.examDate, module: m })
  }
  const activeIds = new Set(modules.map((m) => m.id))
  for (const u of units) {
    if (u.dueDate && u.dueDate >= from && u.dueDate <= to && activeIds.has(u.moduleId)) {
      events.push({ kind: 'unit', date: u.dueDate, module: modules.find((m) => m.id === u.moduleId), unit: u })
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'exam' ? -1 : 1))
}

function EventRow({ e, today, showDate }: { e: UniEvent; today: DateStr; showDate: boolean }) {
  if (e.kind === 'exam') {
    return (
      <Link to={`/uni/${e.module.id}`} className="flex items-center gap-3 rounded-lg py-1.5 hover:bg-zinc-800/50">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500/15">
          <GraduationCap className="size-4 text-rose-300" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-rose-200">Klausur {e.module.shortName || e.module.name}</span>
          <span className="text-xs text-zinc-400">
            {showDate && fmt(e.date, 'EEEE, dd.MM.')}
            {e.module.examTime && `${showDate ? ' · ' : ''}${e.module.examTime} Uhr`}
          </span>
        </span>
      </Link>
    )
  }
  const done = e.unit.doneDate != null
  const overdue = !done && e.date < today
  return (
    <div className="flex items-center gap-3 py-1.5">
      <CheckCircle
        checked={done}
        onToggle={() => void uniRepo.setStudyUnitDone(e.unit.id, !done, today)}
        label={`${e.unit.title} ${done ? 'als offen markieren' : 'erledigt'}`}
      />
      <Link to={`/uni/${e.unit.moduleId}`} className="min-w-0 flex-1">
        <span className={cx('block text-sm leading-snug', done ? 'text-zinc-500 line-through' : 'text-zinc-100')}>
          {e.module?.shortName}: {e.unit.title}
        </span>
        <span className={cx('text-xs', overdue ? 'font-medium text-rose-400' : 'text-zinc-400')}>
          {UNIT_TYPE_LABEL[e.unit.type]} ·{' '}
          {overdue ? `überfällig seit ${fmt(e.date, 'dd.MM.')}` : `fällig ${fmt(e.date, 'EE dd.MM.')}`}
        </span>
      </Link>
    </div>
  )
}

/** Wochenansicht: Klausuren + fällige Lerneinheiten der Woche und Kurzstatus der Module. */
export function WeekUni({ monday, sunday }: { monday: DateStr; sunday: DateStr }) {
  const today = useToday()
  const data = useUniData(today)
  const units = useStudyUnits()

  const link = (
    <Link to="/uni" className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-200">
      Uni <ChevronRight className="size-3.5" />
    </Link>
  )
  if (data === undefined || !units) {
    return (
      <Card title="Uni-Termine">
        <Spinner />
      </Card>
    )
  }
  if (data === null) return null
  const modules = data.modules.map((m) => m.module)
  const events = collectEvents(modules, units, monday, sunday)
  const behind = data.modules.filter((m) => m.progress.status === 'behind')

  return (
    <Card title="Uni-Termine" action={link}>
      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">Keine Klausuren oder Abgaben in dieser Woche.</p>
      ) : (
        <div className="divide-y divide-zinc-800/70">
          {events.map((e, i) => (
            <EventRow key={i} e={e} today={today} showDate />
          ))}
        </div>
      )}
      {behind.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-800 pt-3 text-xs">
          <span className="text-zinc-400">Hinterher:</span>
          {behind.map((m) => (
            <Link key={m.module.id} to={`/uni/${m.module.id}`} className="inline-flex items-center gap-1">
              <span className="text-zinc-200">{m.module.shortName}</span>
              <StatusPill progress={m.progress} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

/** Tages-Panel: Klausuren und fällige Lerneinheiten an diesem Tag (heute zusätzlich überfällige). */
export function DayUni({ day }: { day: DateStr }) {
  const today = useToday()
  const modules = useActiveModules()
  const units = useStudyUnits()
  if (!modules || !units) return null
  const events = collectEvents(modules, units, day, day)
  if (day === today) {
    const ids = new Set(modules.map((m) => m.id))
    for (const u of units) {
      if (u.dueDate && u.dueDate < today && !u.doneDate && ids.has(u.moduleId)) {
        events.unshift({ kind: 'unit', date: u.dueDate, module: modules.find((m) => m.id === u.moduleId), unit: u })
      }
    }
  }
  if (events.length === 0) return null
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <GraduationCap className="size-4 text-rose-300" />
        Uni
      </h3>
      <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 px-3">
        {events.map((e, i) => (
          <EventRow key={i} e={e} today={today} showDate={e.date !== day} />
        ))}
      </div>
    </section>
  )
}
