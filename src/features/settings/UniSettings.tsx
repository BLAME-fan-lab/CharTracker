import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Button, Card, IconButton, Spinner, TextInput } from '../../components/ui'
import {
  settingsRepo,
  uniRepo,
  useActiveSemester,
  useAllModules,
  useSettings,
  type AppSettings,
  type Module,
  type Semester,
  type SemesterPeriod,
} from '../../data'
import { cx } from '../../lib/cx'
import { fmt, isValidDateStr } from '../../lib/dates'

export function UniSettings() {
  const semester = useActiveSemester()
  const settings = useSettings()
  if (semester === undefined || !settings) {
    return (
      <Card title="Uni">
        <Spinner />
      </Card>
    )
  }
  return (
    <>
      <SollSettings settings={settings} />
      {semester && <SemesterForm semester={semester} />}
      {semester && <ModuleSettings semesterId={semester.id} />}
    </>
  )
}

/* ---------- Soll-Parameter ---------- */

function SollSettings({ settings }: { settings: AppSettings }) {
  return (
    <Card title="Uni: Soll-Berechnung">
      <div className="space-y-3">
        <NumberSetting
          label="Puffer vor der Klausur"
          unit="Tage"
          value={settings.studyBufferDays}
          min={0}
          max={60}
          onSave={(v) => void settingsRepo.updateSettings({ studyBufferDays: v })}
        />
        <NumberSetting
          label="„Im Plan“-Toleranz"
          unit="± pp"
          value={settings.statusTolerancePp}
          min={0}
          max={50}
          onSave={(v) => void settingsRepo.updateSettings({ statusTolerancePp: v })}
        />
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span>
            Soll in Semesterpausen anhalten
            <span className="block text-xs text-zinc-500">z. B. Weihnachtspause zählt nicht als Lernzeit</span>
          </span>
          <input
            type="checkbox"
            checked={settings.pauseSollInBreaks}
            onChange={(e) => void settingsRepo.updateSettings({ pauseSollInBreaks: e.target.checked })}
            className="size-5 shrink-0 accent-emerald-500"
          />
        </label>
      </div>
    </Card>
  )
}

function NumberSetting({
  label,
  unit,
  value,
  min,
  max,
  onSave,
}: {
  label: string
  unit: string
  value: number
  min: number
  max: number
  onSave: (v: number) => void
}) {
  const [text, setText] = useState(String(value))
  const n = Number(text)
  const valid = Number.isInteger(n) && n >= min && n <= max
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <TextInput
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => (valid ? n !== value && onSave(n) : setText(String(value)))}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className={cx('w-16 text-right', !valid && 'border-rose-500')}
        />
        <span className="w-10 text-zinc-400">{unit}</span>
      </span>
    </label>
  )
}

/* ---------- Semester ---------- */

function DateRow({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: ReactNode }) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
      <span>
        {label}
        {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      </span>
      <TextInput type="date" value={value} onChange={(e) => onChange(e.target.value)} className="w-auto" />
    </label>
  )
}

function SemesterForm({ semester }: { semester: Semester }) {
  const [s, setS] = useState(semester)
  const [saved, setSaved] = useState(false)
  const set = (patch: Partial<Semester>) => {
    setS((prev) => ({ ...prev, ...patch }))
    setSaved(false)
  }
  const setBreak = (i: number, patch: Partial<SemesterPeriod>) =>
    set({ breaks: s.breaks.map((b, j) => (j === i ? { ...b, ...patch } : b)) })

  const dates = [s.start, s.end, s.lectureStart, s.lectureEnd, s.lectureFreeStart, s.lectureFreeEnd, s.targetDate]
  const breaksValid = s.breaks.every((b) => b.name.trim() && isValidDateStr(b.start) && isValidDateStr(b.end) && b.start <= b.end)
  const valid = s.name.trim() !== '' && dates.every(isValidDateStr) && breaksValid && s.lectureStart < s.targetDate

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    await uniRepo.updateSemester(semester.id, {
      name: s.name.trim(),
      start: s.start,
      end: s.end,
      lectureStart: s.lectureStart,
      lectureEnd: s.lectureEnd,
      lectureFreeStart: s.lectureFreeStart,
      lectureFreeEnd: s.lectureFreeEnd,
      breaks: s.breaks.map((b) => ({ ...b, name: b.name.trim() })),
      targetDate: s.targetDate,
    })
    setSaved(true)
  }

  return (
    <Card title="Uni: Semester">
      <form onSubmit={(e) => void save(e)} className="space-y-3">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Name</span>
          <TextInput value={s.name} onChange={(e) => set({ name: e.target.value })} className="w-40" />
        </label>
        <DateRow label="Semesterbeginn" value={s.start} onChange={(v) => set({ start: v })} />
        <DateRow label="Semesterende" value={s.end} onChange={(v) => set({ end: v })} />
        <DateRow
          label="Vorlesungsbeginn"
          hint="Ab hier steigt das Soll"
          value={s.lectureStart}
          onChange={(v) => set({ lectureStart: v })}
        />
        <DateRow label="Vorlesungsende" value={s.lectureEnd} onChange={(v) => set({ lectureEnd: v })} />
        <DateRow label="Vorlesungsfrei ab" value={s.lectureFreeStart} onChange={(v) => set({ lectureFreeStart: v })} />
        <DateRow label="Vorlesungsfrei bis" value={s.lectureFreeEnd} onChange={(v) => set({ lectureFreeEnd: v })} />
        <DateRow
          label="Alles fertig bis"
          hint="Soll = 100 % (sofern Klausur − Puffer nicht früher ist)"
          value={s.targetDate}
          onChange={(v) => set({ targetDate: v })}
        />

        <div className="space-y-2 border-t border-zinc-800 pt-3">
          <div className="text-sm">Pausen</div>
          {s.breaks.map((b, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <TextInput value={b.name} onChange={(e) => setBreak(i, { name: e.target.value })} aria-label="Name der Pause" className="w-36" />
              <TextInput type="date" value={b.start} onChange={(e) => setBreak(i, { start: e.target.value })} aria-label="Pause von" className="w-auto" />
              <span className="text-zinc-500">–</span>
              <TextInput type="date" value={b.end} onChange={(e) => setBreak(i, { end: e.target.value })} aria-label="Pause bis" className="w-auto" />
              <IconButton label="Pause entfernen" onClick={() => set({ breaks: s.breaks.filter((_, j) => j !== i) })}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() => set({ breaks: [...s.breaks, { name: 'Pause', start: s.lectureStart, end: s.lectureStart }] })}
          >
            <Plus className="size-4" /> Pause hinzufügen
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 pt-3">
          <span className={cx('text-xs', valid ? 'text-zinc-500' : 'text-rose-300')}>
            {valid
              ? `Soll läuft vom ${fmt(s.lectureStart, 'dd.MM.')} bis ${fmt(s.targetDate, 'dd.MM.yyyy')}.`
              : 'Bitte alle Daten prüfen (Vorlesungsbeginn muss vor „alles fertig bis“ liegen).'}
          </span>
          <Button type="submit" variant="primary" disabled={!valid || saved} className="shrink-0">
            {saved ? (
              <>
                <Check className="size-4" /> Gespeichert
              </>
            ) : (
              'Speichern'
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}

/* ---------- Module ---------- */

function ModuleSettings({ semesterId }: { semesterId: string }) {
  const all = useAllModules()
  const [name, setName] = useState('')
  const [short, setShort] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  if (!all) return null
  const modules = all.filter((m) => m.semesterId === semesterId)
  const active = modules.filter((m) => !m.archived)
  const archived = modules.filter((m) => m.archived)

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    void uniRepo.createModule(semesterId, name, short)
    setName('')
    setShort('')
  }

  return (
    <Card title="Uni: Module">
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {active.map((m, i) => (
          <ModuleRow key={m.id} module={m} isFirst={i === 0} isLast={i === active.length - 1} />
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex flex-wrap gap-2">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Neues Modul" aria-label="Modulname" className="min-w-0 flex-1" />
        <TextInput value={short} onChange={(e) => setShort(e.target.value)} placeholder="Kürzel" aria-label="Kürzel" className="w-24" />
        <Button type="submit" variant="secondary" disabled={!name.trim()}>
          <Plus className="size-4" /> Hinzufügen
        </Button>
      </form>
      {archived.length > 0 && (
        <div className="mt-3">
          <button type="button" className="text-sm text-zinc-400 hover:text-zinc-200" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Archivierte ausblenden' : `Archivierte anzeigen (${archived.length})`}
          </button>
          {showArchived && (
            <ul className="mt-2 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
              {archived.map((m) => (
                <li key={m.id} className="flex items-center gap-2 py-1 pr-1 pl-3">
                  <span className="flex-1 text-sm text-zinc-400">{m.name}</span>
                  <IconButton label="Wiederherstellen" onClick={() => void uniRepo.setModuleArchived(m.id, false)}>
                    <ArchiveRestore className="size-4" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        Klausurtermine und Lerneinheiten pflegst du auf der Seite des Moduls (Uni → Modul antippen). Archivierte Module
        verschwinden aus der Übersicht, ihre Daten bleiben erhalten.
      </p>
    </Card>
  )
}

function ModuleRow({ module: m, isFirst, isLast }: { module: Module; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(m.name)
  const [short, setShort] = useState(m.shortName)

  if (editing) {
    return (
      <li className="space-y-2 p-3">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="Modulname" autoFocus />
        <TextInput value={short} onChange={(e) => setShort(e.target.value)} aria-label="Kürzel" placeholder="Kürzel" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            <X className="size-4" /> Abbrechen
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim()}
            onClick={() => {
              void uniRepo.updateModule(m.id, { name, shortName: short || name })
              setEditing(false)
            }}
          >
            <Check className="size-4" /> Speichern
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-1 py-1 pr-1 pl-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-snug break-words">{m.name}</div>
        <div className="text-xs text-zinc-500">
          {m.shortName}
          {m.examDate && ` · Klausur ${fmt(m.examDate, 'dd.MM.yyyy')}`}
        </div>
      </div>
      <IconButton label="Nach oben" disabled={isFirst} onClick={() => void uniRepo.moveModule(m.id, -1)}>
        <ArrowUp className="size-4" />
      </IconButton>
      <IconButton label="Nach unten" disabled={isLast} onClick={() => void uniRepo.moveModule(m.id, 1)}>
        <ArrowDown className="size-4" />
      </IconButton>
      <IconButton
        label="Bearbeiten"
        onClick={() => {
          setName(m.name)
          setShort(m.shortName)
          setEditing(true)
        }}
      >
        <Pencil className="size-4" />
      </IconButton>
      <IconButton label="Archivieren" onClick={() => void uniRepo.setModuleArchived(m.id, true)}>
        <Archive className="size-4" />
      </IconButton>
    </li>
  )
}
