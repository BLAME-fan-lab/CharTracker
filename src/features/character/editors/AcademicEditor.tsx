import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, ConfirmBar, IconButton, Spinner, TextInput } from '../../../components/ui'
import { characterRepo, uniRepo, useActiveModules, usePastGrades, type Module, type PastGrade } from '../../../data'
import { gradeToLevel } from '../../../domain/character'
import { cx } from '../../../lib/cx'
import { formatDecimal, parseDecimal } from '../../../lib/numbers'

const validGrade = (g: number | null) => g != null && g >= 1 && g <= 5
const validEcts = (e: number | null) => e != null && e > 0 && e <= 60

export function AcademicEditor() {
  const past = usePastGrades()
  const modules = useActiveModules()
  if (!past || !modules) return <Spinner />
  return (
    <>
      <Card title="Aktuelles Semester">
        <p className="mb-3 text-xs text-zinc-500">Trag die Note ein, sobald sie feststeht. Ohne Note zählt das Modul noch nicht.</p>
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {modules.map((m) => (
            <CurrentModuleRow key={m.id} module={m} />
          ))}
        </ul>
      </Card>
      <Card title="Abgeschlossene Module">
        {past.length > 0 && (
          <ul className="mb-3 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {past.map((g) => (
              <PastGradeRow key={g.id} entry={g} />
            ))}
          </ul>
        )}
        <AddPastGrade />
      </Card>
    </>
  )
}

function GradeInputs({
  ects,
  grade,
  onSave,
}: {
  ects: number | null
  grade: number | null
  onSave: (ects: number, grade: number | null) => void
}) {
  const [e, setE] = useState(formatDecimal(ects ?? 5))
  const [g, setG] = useState(formatDecimal(grade, 1))
  const commit = () => {
    const ev = parseDecimal(e)
    const gv = parseDecimal(g)
    if (!validEcts(ev)) return setE(formatDecimal(ects ?? 5))
    if (g.trim() !== '' && !validGrade(gv)) return setG(formatDecimal(grade, 1))
    if (ev !== (ects ?? 5) || (gv ?? null) !== (grade ?? null)) onSave(ev!, g.trim() === '' ? null : gv)
  }
  return (
    <div className="flex items-center gap-1.5">
      <TextInput value={e} onChange={(x) => setE(x.target.value)} onBlur={commit} inputMode="decimal" aria-label="ECTS" className="w-14 text-center" />
      <span className="text-xs text-zinc-500">ECTS</span>
      <TextInput value={g} onChange={(x) => setG(x.target.value)} onBlur={commit} inputMode="decimal" placeholder="–" aria-label="Note" className="w-14 text-center" />
    </div>
  )
}

function CurrentModuleRow({ module: m }: { module: Module }) {
  return (
    <li className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-3">
      <div className="min-w-0">
        <div className="truncate text-sm">{m.shortName || m.name}</div>
        <div className="text-xs text-zinc-500">
          {m.grade != null ? `Level ${Math.floor(gradeToLevel(m.grade))}${m.grade > 4 ? ' – nicht bestanden' : ''}` : 'noch keine Note'}
        </div>
      </div>
      <GradeInputs ects={m.ects ?? 5} grade={m.grade ?? null} onSave={(ects, grade) => void uniRepo.updateModule(m.id, { ects, grade })} />
    </li>
  )
}

function PastGradeRow({ entry }: { entry: PastGrade }) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) {
    return (
      <li>
        <ConfirmBar
          text={`„${entry.name}“ entfernen?`}
          confirmLabel="Entfernen"
          danger
          onConfirm={() => void characterRepo.deletePastGrade(entry.id)}
          onCancel={() => setConfirming(false)}
        />
      </li>
    )
  }
  return (
    <li className="flex items-center justify-between gap-2 py-1.5 pr-1 pl-3">
      <div className="min-w-0">
        <div className="truncate text-sm">{entry.name}</div>
        <div className={cx('text-xs', entry.grade > 4 ? 'text-rose-300' : 'text-zinc-500')}>
          {entry.semester ? `${entry.semester} · ` : ''}
          {entry.grade > 4 ? 'nicht bestanden' : `Level ${Math.floor(gradeToLevel(entry.grade))}`}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <GradeInputs ects={entry.ects} grade={entry.grade} onSave={(ects, grade) => grade != null && void characterRepo.updatePastGrade(entry.id, { ects, grade })} />
        <IconButton label="Entfernen" onClick={() => setConfirming(true)}>
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </li>
  )
}

function AddPastGrade() {
  const [name, setName] = useState('')
  const [ects, setEcts] = useState('5')
  const [grade, setGrade] = useState('')
  const [semester, setSemester] = useState('')
  const e = parseDecimal(ects)
  const g = parseDecimal(grade)
  const valid = name.trim() !== '' && validEcts(e) && validGrade(g)
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (!valid) return
    void characterRepo.createPastGrade(name, e!, g!, semester.trim() || null)
    setName('')
    setGrade('')
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl bg-zinc-950/50 p-3">
      <div className="flex flex-wrap gap-2">
        <TextInput value={name} onChange={(x) => setName(x.target.value)} placeholder="Modul, z. B. ET1" aria-label="Modulname" className="min-w-0 flex-1" />
        <TextInput value={semester} onChange={(x) => setSemester(x.target.value)} placeholder="Semester" aria-label="Semester" className="w-28" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TextInput value={ects} onChange={(x) => setEcts(x.target.value)} inputMode="decimal" aria-label="ECTS" className="w-16 text-center" />
        <span className="text-xs text-zinc-500">ECTS</span>
        <TextInput value={grade} onChange={(x) => setGrade(x.target.value)} inputMode="decimal" placeholder="Note" aria-label="Note" className="w-20 text-center" />
        <Button type="submit" variant="primary" disabled={!valid} className="ml-auto">
          <Plus className="size-4" /> Hinzufügen
        </Button>
      </div>
      <p className="text-xs text-zinc-500">Note zwischen 1,0 und 5,0. Nicht bestandene Prüfungen kannst du mit 5,0 eintragen – sie zählen nicht zum Schnitt.</p>
    </form>
  )
}
