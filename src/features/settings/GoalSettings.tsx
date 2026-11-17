import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Spinner, TextInput } from '../../components/ui'
import { goalsRepo, projectsRepo, useGoalTargets, useProjects, type GoalTarget, type Project } from '../../data'
import { versionForWeek } from '../../domain/weekly'
import { todayStr, weekStartOf } from '../../lib/dates'
import { formatHours } from '../../lib/duration'
import { cx } from '../../lib/cx'

export function GoalSettings() {
  const targets = useGoalTargets()
  if (!targets) {
    return (
      <Card title="Wochenziele">
        <Spinner />
      </Card>
    )
  }
  return <GoalForm targets={targets} />
}

function GoalForm({ targets }: { targets: GoalTarget[] }) {
  const monday = weekStartOf(todayStr())
  const currentReading = versionForWeek(targets.filter((t) => t.kind === 'reading'), monday)?.minutes ?? 0
  const currentStudy = versionForWeek(targets.filter((t) => t.kind === 'study'), monday)?.minutes ?? 0
  const [reading, setReading] = useState(String(currentReading))
  const [study, setStudy] = useState(formatHours(currentStudy))
  const [saved, setSaved] = useState(false)

  const readingMin = Number(reading.replace(',', '.'))
  const studyMin = Math.round(Number(study.replace(',', '.')) * 60)
  const valid = Number.isFinite(readingMin) && readingMin >= 0 && Number.isFinite(studyMin) && studyMin >= 0
  const changed = valid && (readingMin !== currentReading || studyMin !== currentStudy)

  const save = async () => {
    if (readingMin !== currentReading) await goalsRepo.saveGoalTarget('reading', monday, readingMin)
    if (studyMin !== currentStudy) await goalsRepo.saveGoalTarget('study', monday, studyMin)
    setSaved(true)
  }

  return (
    <Card title="Wochenziele">
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Lernen pro Woche</span>
          <span className="flex items-center gap-2">
            <TextInput
              inputMode="decimal"
              value={study}
              onChange={(e) => {
                setStudy(e.target.value)
                setSaved(false)
              }}
              className="w-20 text-right"
            />
            <span className="w-8 text-zinc-400">h</span>
          </span>
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Lesen pro Woche</span>
          <span className="flex items-center gap-2">
            <TextInput
              inputMode="numeric"
              value={reading}
              onChange={(e) => {
                setReading(e.target.value)
                setSaved(false)
              }}
              className="w-20 text-right"
            />
            <span className="w-8 text-zinc-400">min</span>
          </span>
        </label>
        <div className="flex items-center justify-between gap-2">
          <span className={cx('text-xs', valid ? 'text-zinc-500' : 'text-rose-300')}>
            {valid ? 'Gilt ab dieser Woche. Vergangene Wochen behalten ihr Soll.' : 'Bitte gültige Zahlen eingeben.'}
          </span>
          <Button variant="primary" disabled={saved || !changed} onClick={() => void save()} className="shrink-0">
            {saved ? (
              <>
                <Check className="size-4" /> Gespeichert
              </>
            ) : (
              'Speichern'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function ProjectSettings() {
  const projects = useProjects()
  const project = projects?.[0]
  if (!projects) return null
  if (!project) return null
  return <ProjectForm key={project.id + project.updatedAt} project={project} />
}

function ProjectForm({ project }: { project: Project }) {
  const [name, setName] = useState(project.name)
  const dirty = name.trim() !== project.name && name.trim() !== ''
  return (
    <Card title="Projekt">
      <div className="space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (dirty) void projectsRepo.renameProject(project.id, name)
          }}
        >
          <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="Projektname" />
          <Button variant="secondary" type="submit" disabled={!dirty} className="shrink-0">
            Umbenennen
          </Button>
        </form>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span>In Wochenansicht und Tages-Panel anzeigen</span>
          <input
            type="checkbox"
            checked={project.active}
            onChange={(e) => void projectsRepo.setProjectActive(project.id, e.target.checked)}
            className="size-5 accent-emerald-500"
          />
        </label>
        <p className="text-xs text-zinc-500">Zeit pro Tag und eine Notiz pro Woche – ohne Ziel. Ausbaubar, wenn du so weit bist.</p>
      </div>
    </Card>
  )
}
