import { Wrench } from 'lucide-react'
import { AutoSaveTextarea } from '../../components/AutoSaveTextarea'
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
          <AutoSaveTextarea
            key={`${project.id}_${monday}`}
            initial={note?.text ?? ''}
            onSave={(text) => void projectsRepo.setProjectNote(project.id, monday, text)}
            placeholder="Notiz zur Woche: Was hast du gemacht, was kommt als Nächstes?"
            label="Projekt-Notiz für diese Woche"
          />
        )}
      </div>
    </Card>
  )
}
