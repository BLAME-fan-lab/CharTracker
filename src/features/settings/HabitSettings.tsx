import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { habitsRepo, useHabits, type Habit, type HabitSkill } from '../../data'
import { habitSkill } from '../../domain/characterSheet'
import { fmt, isValidDateStr, todayStr } from '../../lib/dates'
import { Button, Card, ConfirmBar, IconButton, Spinner, TextInput } from '../../components/ui'
import { cx } from '../../lib/cx'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

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
                <ArchivedHabitRow key={h.id} habit={h} />
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
  const [confirming, setConfirming] = useState(false)
  const [name, setName] = useState(habit.name)
  const [activeFrom, setActiveFrom] = useState(habit.activeFrom)
  const [weekdays, setWeekdays] = useState<number[]>(habit.weekdays ?? [])
  const [skill, setSkill] = useState<HabitSkill>(habitSkill(habit))

  const startEdit = () => {
    setName(habit.name)
    setActiveFrom(habit.activeFrom)
    setWeekdays(habit.weekdays ?? [])
    setSkill(habitSkill(habit))
    setEditing(true)
  }
  const save = (e?: FormEvent) => {
    e?.preventDefault()
    if (!name.trim() || !isValidDateStr(activeFrom)) return
    // alle oder keine Tage = täglich
    const days = weekdays.length === 0 || weekdays.length === 7 ? null : [...weekdays].sort()
    void habitsRepo.updateHabit(habit.id, { name, activeFrom, weekdays: days, skill })
    setEditing(false)
  }

  if (confirming) {
    return (
      <li>
        <ConfirmBar
          text={`„${habit.name}“ archivieren? Ab heute zählt sie nicht mehr, vergangene Tage bleiben erhalten.`}
          confirmLabel="Archivieren"
          onConfirm={() => void habitsRepo.archiveHabit(habit.id)}
          onCancel={() => setConfirming(false)}
        />
      </li>
    )
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
          <div className="space-y-1">
            <span className="text-sm text-zinc-400">Wochentage</span>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Wochentage">
              {WEEKDAYS.map((label, i) => {
                const d = i + 1
                const on = weekdays.length === 0 || weekdays.includes(d)
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const base = weekdays.length === 0 ? [1, 2, 3, 4, 5, 6, 7] : weekdays
                      const next = on ? base.filter((x) => x !== d) : [...base, d]
                      setWeekdays(next.length === 0 ? [] : next)
                    }}
                    className={cx(
                      'size-9 rounded-lg text-xs font-medium transition-colors',
                      on ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40' : 'bg-zinc-900 text-zinc-500',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <span className="block text-xs text-zinc-500">Z. B. „Aufräumen & Müll“ nur am Samstag.</span>
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="shrink-0">Zählt zu</span>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value as HabitSkill)}
              className="min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100"
            >
              <option value="health">Gesundheit</option>
              <option value="hygiene">Hygiene & Pflege</option>
              <option value="none">keinem Skill-Baum</option>
            </select>
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

  const skillLabel = { health: 'Gesundheit', hygiene: 'Hygiene', none: null }[habitSkill(habit)]
  return (
    <li className="flex items-center gap-1 py-1 pr-1 pl-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-snug break-words">{habit.name}</div>
        <div className="text-xs text-zinc-500">
          {habit.weekdays?.length ? `nur ${habit.weekdays.map((d) => WEEKDAYS[d - 1]).join(', ')}` : 'täglich'}
          {skillLabel && ` · ${skillLabel}`} · ab {fmt(habit.activeFrom, 'dd.MM.yy')}
        </div>
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
      <IconButton label="Archivieren" onClick={() => setConfirming(true)}>
        <Archive className="size-4" />
      </IconButton>
    </li>
  )
}

function ArchivedHabitRow({ habit }: { habit: Habit }) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) {
    return (
      <li>
        <ConfirmBar
          text={`„${habit.name}“ endgültig löschen? Alle Haken dieser Gewohnheit gehen verloren.`}
          confirmLabel="Löschen"
          danger
          onConfirm={() => void habitsRepo.deleteHabit(habit.id)}
          onCancel={() => setConfirming(false)}
        />
      </li>
    )
  }
  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-snug break-words text-zinc-300">{habit.name}</div>
        <div className="text-xs text-zinc-500">
          {fmt(habit.activeFrom, 'dd.MM.yyyy')} – {fmt(habit.archivedFrom!, 'dd.MM.yyyy')}
        </div>
      </div>
      <IconButton label="Wiederherstellen" onClick={() => void habitsRepo.restoreHabit(habit.id)}>
        <ArchiveRestore className="size-4" />
      </IconButton>
      <IconButton label="Endgültig löschen" className="hover:text-rose-300" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" />
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
