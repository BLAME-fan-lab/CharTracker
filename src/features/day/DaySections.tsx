import { BookOpen, Dumbbell, GraduationCap, Music, Plus, Scale, Wrench, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { DurationStepper } from '../../components/DurationStepper'
import { Spinner } from '../../components/ui'
import {
  characterRepo,
  goalsRepo,
  projectsRepo,
  trainingRepo,
  useActiveModules,
  useBodyLogs,
  useBooks,
  useMusicLogs,
  useProfile,
  useProjectLogs,
  useProjects,
  useReadingLogs,
  useStudyLogs,
  useTrainingSessions,
  useTrainingTypes,
} from '../../data'
import type { DateStr } from '../../lib/dates'
import { formatHM } from '../../lib/duration'
import { formatDecimal, parseDecimal } from '../../lib/numbers'
import { DIFFICULTY_LABEL } from '../character/labels'

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
  const books = useBooks()
  if (!logs || !books) return <Spinner />
  const minutesFor = (bookId: string | null) => logs.find((l) => (l.bookId ?? null) === bookId)?.minutes ?? 0
  const total = logs.reduce((a, l) => a + l.minutes, 0)
  // Aktuelle Bücher + Bücher mit Einträgen an diesem Tag
  const shown = books.filter((b) => b.status === 'reading' || logs.some((l) => l.bookId === b.id))
  const showGeneral = shown.length === 0 || minutesFor(null) > 0
  return (
    <Section
      icon={<BookOpen className="size-4 text-amber-400" />}
      title="Lesen"
      aside={total > 0 ? <span className="text-sm tabular-nums text-zinc-400">{total} min</span> : undefined}
    >
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {shown.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-3">
            <span className="min-w-0">
              <span className="block truncate text-sm text-zinc-300">{b.title}</span>
              <span className="text-xs text-zinc-500">{DIFFICULTY_LABEL[b.difficulty]}</span>
            </span>
            <DurationStepper
              mode="min"
              value={minutesFor(b.id)}
              onChange={(m) => void goalsRepo.setReadingMinutes(day, m, b.id)}
              disabled={disabled}
              label={`Lesezeit ${b.title}`}
            />
          </li>
        ))}
        {showGeneral && (
          <li className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-3">
            <span className="text-sm text-zinc-300">{shown.length ? 'Ohne Buch' : 'Gelesen'}</span>
            <DurationStepper
              mode="min"
              value={minutesFor(null)}
              onChange={(m) => void goalsRepo.setReadingMinutes(day, m)}
              disabled={disabled}
              label="Lesezeit"
            />
          </li>
        )}
      </ul>
      {books.length === 0 && (
        <p className="text-xs text-zinc-500">Bücher mit Schwierigkeit legst du unter Charakter → Lesen an.</p>
      )}
    </Section>
  )
}

export function DayMusic({ day, disabled }: { day: DateStr; disabled: boolean }) {
  const logs = useMusicLogs()
  const profile = useProfile()
  if (!logs || !profile) return <Spinner />
  const minutes = logs.find((l) => l.date === day)?.minutes ?? 0
  return (
    <Section icon={<Music className="size-4 text-fuchsia-400" />} title={profile.instrument || 'Musik'}>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 py-1.5 pr-1.5 pl-3">
        <span className="text-sm text-zinc-300">Geübt</span>
        <DurationStepper
          mode="min"
          step={10}
          value={minutes}
          onChange={(m) => void characterRepo.setMusicMinutes(day, m)}
          disabled={disabled}
          label={`Übungszeit ${profile.instrument}`}
        />
      </div>
    </Section>
  )
}

export function DayWeight({ day, disabled }: { day: DateStr; disabled: boolean }) {
  const logs = useBodyLogs()
  const [text, setText] = useState<string | null>(null)
  if (!logs) return <Spinner />
  const entry = logs.find((l) => l.date === day)
  const value = text ?? formatDecimal(entry?.weightKg ?? null)
  const commit = () => {
    if (text == null) return
    const v = parseDecimal(text)
    if (text.trim() === '') void characterRepo.setBodyLog(day, { weightKg: null })
    else if (v != null && v >= 30 && v <= 300) void characterRepo.setBodyLog(day, { weightKg: v })
    setText(null)
  }
  return (
    <Section icon={<Scale className="size-4 text-rose-400" />} title="Gewicht">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 py-1.5 pr-1.5 pl-3">
        <span className="text-sm text-zinc-300">Heute gewogen (optional)</span>
        <span className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            disabled={disabled}
            placeholder="–"
            aria-label="Gewicht in kg"
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="h-8 w-16 rounded-lg border border-zinc-700 bg-zinc-950 text-center text-sm tabular-nums text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
          />
          <span className="text-xs text-zinc-500">kg</span>
        </span>
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
