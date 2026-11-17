import { Archive, ArchiveRestore, Check, Minus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, ConfirmBar, IconButton, Spinner, TextInput } from '../../components/ui'
import { trainingRepo, useTrainingPlans, useTrainingTypes, type TrainingPlan, type TrainingType } from '../../data'
import { versionForWeek } from '../../domain/weekly'
import { fmt, isoWeek, isValidDateStr, todayStr, weekStartOf } from '../../lib/dates'

export function TrainingSettings() {
  const types = useTrainingTypes()
  const plans = useTrainingPlans()
  if (!types || !plans) {
    return (
      <Card title="Training">
        <Spinner />
      </Card>
    )
  }
  return (
    <Card title="Training">
      <div className="space-y-6">
        <PlanEditor
          types={types.filter((t) => !t.archived)}
          plans={plans}
        />
        <PlanHistory plans={plans} types={types} />
        <TypeList types={types} />
      </div>
    </Card>
  )
}

function PlanEditor({ types, plans }: { types: TrainingType[]; plans: TrainingPlan[] }) {
  const thisMonday = weekStartOf(todayStr())
  const current = versionForWeek(plans, thisMonday)
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(types.map((t) => [t.id, current?.targets.find((x) => x.typeId === t.id)?.count ?? 0])),
  )
  const [from, setFrom] = useState(thisMonday)
  const [saved, setSaved] = useState(false)
  const monday = isValidDateStr(from) ? weekStartOf(from) : thisMonday
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const save = async () => {
    await trainingRepo.saveTrainingPlan(
      monday,
      types.map((t) => ({ typeId: t.id, count: counts[t.id] ?? 0 })),
    )
    setSaved(true)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-300">Trainingsplan pro Woche</h3>
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {types.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-3">
            <span className="text-sm">{t.name}</span>
            <CountStepper
              label={t.name}
              value={counts[t.id] ?? 0}
              onChange={(v) => {
                setCounts((c) => ({ ...c, [t.id]: v }))
                setSaved(false)
              }}
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
        <span>Gilt ab Woche von</span>
        <TextInput
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setSaved(false)
          }}
          className="w-auto"
          aria-label="Plan gilt ab"
        />
        <span className="text-xs text-zinc-500">
          = KW {isoWeek(monday)} ({fmt(monday, 'dd.MM.yyyy')})
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-500">
          {total}× pro Woche. Vergangene Wochen behalten ihren Plan, spätere Pläne werden ersetzt.
        </span>
        <Button variant="primary" onClick={() => void save()} disabled={saved} className="shrink-0">
          {saved ? (
            <>
              <Check className="size-4" /> Gespeichert
            </>
          ) : (
            'Plan speichern'
          )}
        </Button>
      </div>
    </div>
  )
}

function PlanHistory({ plans, types }: { plans: TrainingPlan[]; types: TrainingType[] }) {
  const [confirming, setConfirming] = useState<string | null>(null)
  if (plans.length < 2) return null
  const summary = (p: TrainingPlan) =>
    p.targets.length === 0
      ? 'kein Training'
      : p.targets.map((t) => `${t.count}× ${types.find((x) => x.id === t.typeId)?.name ?? '?'}`).join(', ')

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-300">Verlauf</h3>
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {plans.map((p, i) =>
          confirming === p.id ? (
            <li key={p.id}>
              <ConfirmBar
                text={`Plan ab ${fmt(p.validFrom, 'dd.MM.yyyy')} löschen?`}
                confirmLabel="Löschen"
                danger
                onConfirm={() => void trainingRepo.deleteTrainingPlan(p.id)}
                onCancel={() => setConfirming(null)}
              />
            </li>
          ) : (
            <li key={p.id} className="flex items-center gap-2 py-1 pr-1 pl-3 text-sm">
              <span className="w-24 shrink-0 text-xs tabular-nums text-zinc-400">ab {fmt(p.validFrom, 'dd.MM.yy')}</span>
              <span className="min-w-0 flex-1 text-zinc-300">{summary(p)}</span>
              {i > 0 && (
                <IconButton label="Plan löschen" onClick={() => setConfirming(p.id)}>
                  <Trash2 className="size-4" />
                </IconButton>
              )}
            </li>
          ),
        )}
      </ul>
    </div>
  )
}

function TypeList({ types }: { types: TrainingType[] }) {
  const [name, setName] = useState('')
  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    void trainingRepo.createTrainingType(name)
    setName('')
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-300">Trainingsarten</h3>
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {types.map((t) => (
          <TypeRow key={t.id} type={t} />
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Neue Art, z. B. Fußball" aria-label="Neue Trainingsart" />
        <Button variant="secondary" type="submit" disabled={!name.trim()} className="shrink-0">
          <Plus className="size-4" /> Hinzufügen
        </Button>
      </form>
      <p className="text-xs text-zinc-500">
        Neue Arten zählen erst, wenn du sie im Plan oben mit einer Anzahl speicherst. Archivierte Arten bleiben in alten
        Wochen sichtbar.
      </p>
    </div>
  )
}

function TypeRow({ type }: { type: TrainingType }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(type.name)
  if (editing) {
    return (
      <li className="p-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            void trainingRepo.renameTrainingType(type.id, name)
            setEditing(false)
          }}
        >
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-label="Name" />
          <IconButton label="Abbrechen" onClick={() => setEditing(false)}>
            <X className="size-4" />
          </IconButton>
          <IconButton label="Speichern" type="submit">
            <Check className="size-4" />
          </IconButton>
        </form>
      </li>
    )
  }
  return (
    <li className="flex items-center gap-1 py-1 pr-1 pl-3">
      <span className={type.archived ? 'flex-1 text-sm text-zinc-500 line-through' : 'flex-1 text-sm'}>{type.name}</span>
      <IconButton
        label="Umbenennen"
        onClick={() => {
          setName(type.name)
          setEditing(true)
        }}
      >
        <Pencil className="size-4" />
      </IconButton>
      <IconButton
        label={type.archived ? 'Wiederherstellen' : 'Archivieren'}
        onClick={() => void trainingRepo.setTrainingTypeArchived(type.id, !type.archived)}
      >
        {type.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
      </IconButton>
    </li>
  )
}

export function CountStepper({
  value,
  onChange,
  label,
  max = 14,
}: {
  value: number
  onChange: (v: number) => void
  label: string
  max?: number
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <IconButton label={`${label} weniger`} disabled={value <= 0} onClick={() => onChange(value - 1)} className="size-8 bg-zinc-800">
        <Minus className="size-4" />
      </IconButton>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}×</span>
      <IconButton label={`${label} mehr`} disabled={value >= max} onClick={() => onChange(value + 1)} className="size-8 bg-zinc-800">
        <Plus className="size-4" />
      </IconButton>
    </div>
  )
}
