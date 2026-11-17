import { BookOpen, Dumbbell, GraduationCap, Plus, Wrench, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { DurationStepper } from '../../components/DurationStepper'
import { Spinner } from '../../components/ui'
import {
  goalsRepo,
  projectsRepo,
  trainingRepo,
  useActiveModules,
  useProjectLogs,
  useProjects,
  useReadingLogs,
  useStudyLogs,
  useTrainingSessions,
  useTrainingTypes,
} from '../../data'
import type { DateStr } from '../../lib/dates'
import { formatHM } from '../../lib/duration'

function Section({ icon, title, aside, children }: { icon: ReactNode; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          {icon}
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function DayTraining({ day, disabled }: { day: DateStr; disabled: boolean }) {
  const types = useTrainingTypes()
  const sessions = useTrainingSessions(day, day)
  if (!types || !sessions) return <Spinner />
  const typeName = (id: string) => types.find((t) => t.id === id)?.name ?? 'Unbekannt'
  const selectable = types.filter((t) => !t.archived)

  return (
    <Section icon={<Dumbbell className="size-4 text-sky-400" />} title="Training">
      {sessions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sessions.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 py-1 pr-1 pl-3 text-sm text-sky-200"
            >
              {typeName(s.typeId)}
              {s.source === 'strong' && <span className="text-xs text-sky-400/70">Strong</span>}
              <button
                type="button"
                aria-label={`${typeName(s.typeId)} entfernen`}
                onClick={() => void trainingRepo.deleteTrainingSession(s.id)}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-sky-500/25"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Keine Einheit eingetragen.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {selectable.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={disabled}
            onClick={() => void trainingRepo.addTrainingSession(day, t.id)}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-dashed border-zinc-700 px-3 text-sm text-zinc-300 hover:border-sky-500 hover:text-sky-200 disabled:opacity-40"
          >
            <Plus className="size-4" />
            {t.name}
          </button>
        ))}
      </div>
    </Section>
  )
}

export function DayStudy({ day, disabled }: { day: DateStr; disabled: boolean }) {
  const modules = useActiveModules()
  const logs = useStudyLogs(day, day)
  if (!modules || !logs) return <Spinner />
  const minutesFor = (moduleId: string | null) => logs.find((l) => l.moduleId === moduleId)?.minutes ?? 0
  const total = logs.reduce((a, l) => a + l.minutes, 0)
  const rows: { id: string | null; name: string }[] = [
    ...modules.map((m) => ({ id: m.id as string | null, name: m.shortName || m.name })),
    { id: null, name: 'Allgemein' },
  ]

  return (
    <Section
      icon={<GraduationCap className="size-4 text-violet-400" />}
      title="Lernen"
      aside={<span className="text-sm tabular-nums text-zinc-400">{formatHM(total)} h</span>}
    >
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {rows.map((r) => (
          <li key={r.id ?? 'general'} className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-3">
            <span className="min-w-0 truncate text-sm text-zinc-300">{r.name}</span>
            <DurationStepper
              mode="hm"
              value={minutesFor(r.id)}
              onChange={(m) => void goalsRepo.setStudyMinutes(day, r.id, m)}
              disabled={disabled}
              label={`Lernzeit ${r.name}`}
            />
          </li>
        ))}
      </ul>
      <p className="text-xs text-zinc-500">Eingabe als h:mm, z. B. „1:30“ oder „1,5“. Die Tasten ändern um 15 min.</p>
    </Section>
  )
}

export function DayReading({ day, disabled }: { day: DateStr; disabled: boolean }) {
  const logs = useReadingLogs(day, day)
  if (!logs) return <Spinner />
  const minutes = logs[0]?.minutes ?? 0
  return (
    <Section icon={<BookOpen className="size-4 text-amber-400" />} title="Lesen">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 py-1.5 pr-1.5 pl-3">
        <span className="text-sm text-zinc-300">Gelesen</span>
        <DurationStepper
          mode="min"
          value={minutes}
          onChange={(m) => void goalsRepo.setReadingMinutes(day, m)}
          disabled={disabled}
          label="Lesezeit"
        />
      </div>
    </Section>
  )
}

export function DayProject({ day, disabled }: { day: DateStr; disabled: boolean }) {
  const projects = useProjects()
  const logs = useProjectLogs(day, day)
  const project = projects?.find((p) => p.active)
  if (!projects || !logs) return <Spinner />
  if (!project) return null
  const minutes = logs.find((l) => l.projectId === project.id)?.minutes ?? 0
  return (
    <Section icon={<Wrench className="size-4 text-orange-400" />} title="Projekt">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 py-1.5 pr-1.5 pl-3">
        <span className="min-w-0 truncate text-sm text-zinc-300">{project.name}</span>
        <DurationStepper
          mode="hm"
          value={minutes}
          onChange={(m) => void projectsRepo.setProjectMinutes(project.id, day, m)}
          disabled={disabled}
          label={`Zeit für ${project.name}`}
        />
      </div>
    </Section>
  )
}
