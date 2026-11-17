import { ChevronLeft, ChevronRight, Flame, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { bestPerfectDayStreak, dayCompletion, perfectDayStreak } from '../../domain/habits'
import { addDaysStr, fmt, formatWeekRange, isoWeek, isValidDateStr, weekDays, weekStartOf, type DateStr } from '../../lib/dates'
import { useToday } from '../../lib/useToday'
import { Button, Card, IconButton, Spinner } from '../../components/ui'
import { cx } from '../../lib/cx'
import { OverviewHeader } from '../OverviewHeader'
import { useDayPanel } from '../day/useDayPanel'
import { BackupReminder } from './BackupReminder'
import { HabitGrid } from './HabitGrid'
import { ProjectCard } from './ProjectCard'
import { useWeekGoals } from './useWeekGoals'
import { WeeklyGoals } from './WeeklyGoals'
import { WeekTodos } from './WeekTodos'
import { WeekUni } from '../uni/UniDayItems'
import { habitsActiveInRange, habitsActiveOn, sundayOf, useHabitData, type HabitData } from './useHabitData'

export function WeekPage() {
  const today = useToday()
  const [params, setParams] = useSearchParams()
  const raw = params.get('w')
  const monday = isValidDateStr(raw) ? weekStartOf(raw) : weekStartOf(today)
  const isCurrentWeek = monday === weekStartOf(today)
  const { open } = useDayPanel()
  const data = useHabitData()
  const goals = useWeekGoals(monday)

  const goTo = (m: DateStr | null) => {
    const next = new URLSearchParams(params)
    if (m == null || m === weekStartOf(today)) next.delete('w')
    else next.set('w', m)
    setParams(next, { replace: true })
  }

  const days = weekDays(monday)

  return (
    <div className="space-y-4">
      <OverviewHeader mode="week" focus={isCurrentWeek ? today : monday} />
      <BackupReminder today={today} />

      <div className="flex items-center gap-1">
        <IconButton label="Vorherige Woche" onClick={() => goTo(addDaysStr(monday, -7))}>
          <ChevronLeft className="size-5" />
        </IconButton>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-lg font-semibold">KW {isoWeek(monday)}</div>
          <div className="text-xs text-zinc-400">{formatWeekRange(monday)}</div>
        </div>
        <IconButton label="Nächste Woche" onClick={() => goTo(addDaysStr(monday, 7))}>
          <ChevronRight className="size-5" />
        </IconButton>
        <Button variant={isCurrentWeek ? 'ghost' : 'secondary'} disabled={isCurrentWeek} onClick={() => goTo(null)}>
          Heute
        </Button>
      </div>

      {!data ? (
        <Spinner />
      ) : (
        <>
          <StreakSummary data={data} today={today} monday={monday} />
          <Card title="Tägliche Ziele">
            <HabitGrid
              days={days}
              habits={habitsActiveInRange(data.habits, monday, sundayOf(monday))}
              data={data}
              today={today}
              onOpenDay={open}
              emptyHint={emptyHint(data, monday)}
            />
          </Card>
        </>
      )}
      <WeekTodos days={days} today={today} onOpenDay={open} />
      <WeekUni monday={monday} sunday={sundayOf(monday)} />
      <WeeklyGoals goals={goals} days={days} today={today} onOpenDay={open} />
      <ProjectCard monday={monday} days={days} today={today} onOpenDay={open} />
    </div>
  )
}

function emptyHint(data: HabitData, monday: DateStr): string {
  const current = data.habits.filter((h) => h.archivedFrom == null)
  if (current.length === 0) return 'Noch keine Gewohnheiten angelegt. Lege welche in den Einstellungen an.'
  const start = current.reduce((min, h) => (h.activeFrom < min ? h.activeFrom : min), current[0].activeFrom)
  if (start > sundayOf(monday)) {
    return `Deine Gewohnheiten zählen ab ${fmt(start, 'd. MMMM yyyy')}. Das Startdatum kannst du in den Einstellungen ändern (Bearbeiten → „Zählt ab“).`
  }
  return 'In dieser Woche war keine Gewohnheit aktiv.'
}

function StreakSummary({ data, today, monday }: { data: HabitData; today: DateStr; monday: DateStr }) {
  const active = data.habits
  const streak = perfectDayStreak(active, data.done, today)
  const best = bestPerfectDayStreak(active, data.done, today)
  const todayC = dayCompletion(habitsActiveOn(active, today), data.done, today)

  // Durchschnitt der Woche über alle vergangenen/heutigen Tage
  const ratios = weekDays(monday)
    .filter((d) => d <= today)
    .map((d) => dayCompletion(active, data.done, d).ratio)
    .filter((r): r is number => r != null)
  const weekAvg = ratios.length ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) : null

  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat
        icon={<Flame className={cx('size-4', streak > 0 ? 'text-amber-400' : 'text-zinc-500')} />}
        label="Streak"
        value={streak}
        hint={streak === 1 ? 'perfekter Tag' : 'perfekte Tage'}
      />
      <Stat icon={<Trophy className="size-4 text-sky-400" />} label="Rekord" value={best} hint={best === 1 ? 'Tag' : 'Tage'} />
      <Stat
        label="Heute"
        value={todayC.active ? `${todayC.done}/${todayC.active}` : '–'}
        hint={weekAvg != null ? `Woche Ø ${weekAvg} %` : 'erledigt'}
      />
    </div>
  )
}

function Stat({ icon, label, value, hint }: { icon?: ReactNode; label: string; value: ReactNode; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-3 py-2.5">
      <div className="flex items-center gap-1 text-xs text-zinc-400">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="truncate text-xs text-zinc-500">{hint}</div>
    </div>
  )
}
