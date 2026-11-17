import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { habitsRepo, useHabits, type Habit } from '../../data'
import { fmt, isValidDateStr, todayStr } from '../../lib/dates'
import { Button, Card, IconButton, Spinner, TextInput } from '../../components/ui'
import { cx } from '../../lib/cx'

export function HabitSettings() {
  const habits = useHabits()
  const [showArchived, setShowArchived] = useState(false)

  if (!habits) return <Card title="Tägliche Ziele"><Spinner /></Card>

  const active = habits.filter((h) => h.archivedFrom == null)
  const archived = habits.filter((h) => h.archivedFrom != null)

  return (
    <Card title="Tägliche Ziele">
      <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
        {active.map((h, i) => (
          <HabitRow key={h.id} habit={h} isFirst={i === 0} isLast={i === active.length - 1} />
        ))}
        {active.length === 0 && <li className="p-3 text-sm text-zinc-400">Noch keine aktiven Gewohnheiten.</li>}
      </ul>

      <AddHabitForm />

      {archived.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="text-sm text-zinc-400 hover:text-zinc-200"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
          >
            {showArchived ? 'Archivierte ausblenden' : `Archivierte anzeigen (${archived.length})`}
          </button>
          {showArchived && (
            <ul className="mt-2 divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
              {archived.map((h) => (
                <li key={h.id} className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-zinc-300">{h.name}</div>
                    <div className="text-xs text-zinc-500">
                      {fmt(h.activeFrom, 'dd.MM.yyyy')} – {fmt(h.archivedFrom!, 'dd.MM.yyyy')}
                    </div>
                  </div>
                  <IconButton label="Wiederherstellen" onClick={() => void habitsRepo.restoreHabit(h.id)}>
                    <ArchiveRestore className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Endgültig löschen"
                    className="hover:text-rose-300"
                    onClick={() => {
                      if (confirm(`„${h.name}“ endgültig löschen? Alle Haken dieser Gewohnheit gehen verloren.`)) {
                        void habitsRepo.deleteHabit(h.id)
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        Archivieren entfernt eine Gewohnheit ab heute. Vergangene Tage bleiben so bewertet, wie sie waren. „Zählt ab“
        legt fest, ab wann eine Gewohnheit in Streak und Erfüllungsgrad eingeht.
      </p>
    </Card>
  )
}

function HabitRow({ habit, isFirst, isLast }: { habit: Habit; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(habit.name)
  const [activeFrom, setActiveFrom] = useState(habit.activeFrom)

  const startEdit = () => {
    setName(habit.name)
    setActiveFrom(habit.activeFrom)
    setEditing(true)
  }
  const save = (e?: FormEvent) => {
    e?.preventDefault()
    if (!name.trim() || !isValidDateStr(activeFrom)) return
    void habitsRepo.updateHabit(habit.id, { name, activeFrom })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="bg-zinc-950/40 p-3">
        <form onSubmit={save} className="space-y-2">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" autoFocus />
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="shrink-0">Zählt ab</span>
            <TextInput
              type="date"
              value={activeFrom}
              max={todayStr()}
              onChange={(e) => setActiveFrom(e.target.value)}
              className="max-w-44"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              <X className="size-4" /> Abbrechen
            </Button>
            <Button variant="primary" type="submit" disabled={!name.trim()}>
              <Check className="size-4" /> Speichern
            </Button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-1 py-1 pr-1 pl-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-snug break-words">{habit.name}</div>
        <div className="text-xs text-zinc-500">zählt ab {fmt(habit.activeFrom, 'dd.MM.yyyy')}</div>
      </div>
      <IconButton label="Nach oben" disabled={isFirst} onClick={() => void habitsRepo.moveHabit(habit.id, -1)}>
        <ArrowUp className="size-4" />
      </IconButton>
      <IconButton label="Nach unten" disabled={isLast} onClick={() => void habitsRepo.moveHabit(habit.id, 1)}>
        <ArrowDown className="size-4" />
      </IconButton>
      <IconButton label="Bearbeiten" onClick={startEdit}>
        <Pencil className="size-4" />
      </IconButton>
      <IconButton
        label="Archivieren"
        onClick={() => {
          if (confirm(`„${habit.name}“ archivieren? Ab heute zählt die Gewohnheit nicht mehr, vergangene Tage bleiben erhalten.`)) {
            void habitsRepo.archiveHabit(habit.id)
          }
        }}
      >
        <Archive className="size-4" />
      </IconButton>
    </li>
  )
}

function AddHabitForm() {
  const [name, setName] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    void habitsRepo.createHabit(name)
    setName('')
  }
  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <TextInput
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Neue Gewohnheit …"
        aria-label="Neue Gewohnheit"
        enterKeyHint="done"
      />
      <Button variant="primary" type="submit" disabled={!name.trim()} className={cx('shrink-0')}>
        <Plus className="size-4" /> Hinzufügen
      </Button>
    </form>
  )
}
