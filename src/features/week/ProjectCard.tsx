import { Wrench } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '../../components/ui'
import { projectsRepo, useProjectLogs, useProjectNote, useProjects } from '../../data'
import { addDaysStr, type DateStr } from '../../lib/dates'
import { formatHM } from '../../lib/duration'
import { DayStrip } from './WeeklyGoals'

/** Schlichter Projekt-Bereich: Zeit pro Tag + Notiz pro Woche. Ohne Ziel. */
export function ProjectCard({
  monday,
  days,
  today,
  onOpenDay,
}: {
  monday: DateStr
  days: DateStr[]
  today: DateStr
  onOpenDay: (day: DateStr) => void
}) {
  const projects = useProjects()
  const project = projects?.find((p) => p.active)
  const logs = useProjectLogs(monday, addDaysStr(monday, 6))
  const note = useProjectNote(project?.id, monday)

  if (!project || !logs) return null

  const mine = logs.filter((l) => l.projectId === project.id)
  const byDay = new Map(mine.map((l) => [l.date, l.minutes]))
  const total = mine.reduce((a, l) => a + l.minutes, 0)

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Wrench className="size-4 text-orange-400" />
          {project.name}
        </span>
      }
      action={<span className="text-sm font-semibold tabular-nums">{formatHM(total)} h</span>}
    >
      <div className="space-y-3">
        <DayStrip
          days={days}
          today={today}
          onOpenDay={onOpenDay}
          cell={(d) => {
            const m = byDay.get(d) ?? 0
            return m > 0 ? <span className="text-orange-200">{formatHM(m)}</span> : null
          }}
        />
        {note !== undefined && (
          <WeekNote
            key={`${project.id}_${monday}`}
            initial={note?.text ?? ''}
            onSave={(text) => void projectsRepo.setProjectNote(project.id, monday, text)}
          />
        )}
      </div>
    </Card>
  )
}

function WeekNote({ initial, onSave }: { initial: string; onSave: (text: string) => void }) {
  const [text, setText] = useState(initial)
  const latest = useRef(initial)
  const saved = useRef(initial)
  const saveRef = useRef(onSave)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    saveRef.current = onSave
  }, [onSave])

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    if (latest.current !== saved.current) {
      saved.current = latest.current
      saveRef.current(latest.current)
    }
  }, [])

  // Beim Wechsel der Woche / Verlassen der Seite offenen Text sichern
  useEffect(() => flush, [flush])

  return (
    <textarea
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        latest.current = e.target.value
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(flush, 800)
      }}
      onBlur={flush}
      rows={2}
      placeholder="Notiz zur Woche: Was hast du gemacht, was kommt als Nächstes?"
      aria-label="Projekt-Notiz für diese Woche"
      className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
    />
  )
}
