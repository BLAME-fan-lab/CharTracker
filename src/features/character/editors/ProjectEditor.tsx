import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, CheckCircle, SegmentedControl, Spinner, TextInput } from '../../../components/ui'
import { characterRepo, useProjectMilestones, useProjects, type MilestoneSize } from '../../../data'
import { MILESTONE_POINTS } from '../../../domain/character'
import { cx } from '../../../lib/cx'
import { fmt, type DateStr } from '../../../lib/dates'

const SIZE_LABEL: Record<MilestoneSize, string> = { small: 'klein', medium: 'mittel', large: 'groß' }

export function ProjectEditor({ today }: { today: DateStr }) {
  const projects = useProjects()
  const milestones = useProjectMilestones()
  const [title, setTitle] = useState('')
  const [size, setSize] = useState<MilestoneSize>('medium')
  if (!projects || !milestones) return <Spinner />
  const project = projects.find((p) => p.active) ?? projects[0]
  if (!project) return null
  const mine = milestones.filter((m) => m.projectId === project.id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    void characterRepo.createProjectMilestone(project.id, title, size)
    setTitle('')
  }

  return (
    <Card title={`Meilensteine: ${project.name}`}>
      {mine.length > 0 && (
        <ul className="mb-3 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {mine.map((m) => {
            const done = m.doneDate != null
            return (
              <li key={m.id} className="flex items-center gap-3 py-1.5 pr-1 pl-3">
                <CheckCircle
                  checked={done}
                  onToggle={() => void characterRepo.updateProjectMilestone(m.id, { doneDate: done ? null : today })}
                  label={`${m.title} ${done ? 'als offen markieren' : 'erreicht'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className={cx('text-sm break-words', done ? 'text-zinc-500 line-through' : 'text-zinc-100')}>{m.title}</div>
                  <div className="text-xs text-zinc-500">
                    {SIZE_LABEL[m.size]} · {MILESTONE_POINTS[m.size]} {MILESTONE_POINTS[m.size] === 1 ? 'Punkt' : 'Punkte'}
                    {done && ` · erreicht am ${fmt(m.doneDate!, 'dd.MM.yy')}`}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Meilenstein löschen"
                  onClick={() => void characterRepo.deleteProjectMilestone(m.id)}
                  className="p-2 text-zinc-600 hover:text-rose-300"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-2 rounded-xl bg-zinc-950/50 p-3">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Schaltplan fertig, Prototyp läuft" aria-label="Neuer Meilenstein" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            value={size}
            onChange={setSize}
            options={(['small', 'medium', 'large'] as const).map((s) => ({ value: s, label: SIZE_LABEL[s] }))}
          />
          <Button type="submit" variant="primary" disabled={!title.trim()}>
            <Plus className="size-4" /> Meilenstein
          </Button>
        </div>
      </form>
      <p className="mt-2 text-xs text-zinc-500">Projektzeit trägst du wie bisher im Tages-Panel ein.</p>
    </Card>
  )
}
