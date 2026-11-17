import { CalendarClock, Check, ChevronLeft, ClipboardList, ListPlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { AutoSaveTextarea } from '../../components/AutoSaveTextarea'
import { Button, Card, CheckCircle, ConfirmBar, IconButton, Spinner, TextInput } from '../../components/ui'
import { uniRepo, type Module, type StudyUnit, type StudyUnitType } from '../../data'
import { parseUnitList } from '../../domain/unitList'
import { cx } from '../../lib/cx'
import { diffDays, fmt, isValidDateStr, type DateStr } from '../../lib/dates'
import { formatHM } from '../../lib/duration'
import { useToday } from '../../lib/useToday'
import { daysUntil, examText, formatPerWeek, pct, UNIT_TYPE_LABEL, UNIT_TYPE_PLURAL, UNIT_TYPES } from './format'
import { useUniData, type ModuleView } from './useUniData'
import { IstSollBar, StatusPill } from './UniParts'

export function ModulePage() {
  const { moduleId } = useParams()
  const today = useToday()
  const data = useUniData(today)

  if (data === undefined) return <Spinner />
  const view = data?.modules.find((m) => m.module.id === moduleId)
  if (!data || !view) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-zinc-400">Modul nicht gefunden.</p>
      </div>
    )
  }

  const { module: m, progress: p } = view
  return (
    <div className="space-y-4">
      <BackLink />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{m.shortName || m.name}</h1>
          {m.shortName && m.shortName !== m.name && <p className="text-sm text-zinc-400">{m.name}</p>}
        </div>
        <StatusPill progress={p} className="mt-1" />
      </div>

      <ProgressCard view={view} today={today} bufferDays={data.config.bufferDays} />
      <ExamCard key={`${m.id}_${m.updatedAt}`} module={m} />
      <Card title="Notizen">
        <AutoSaveTextarea
          key={m.id}
          initial={m.note ?? ''}
          onSave={(note) => void uniRepo.updateModule(m.id, { note: note.trim() ? note : null })}
          placeholder="z. B. Klausurformat, erlaubte Hilfsmittel, Tipps vom Prof"
          label={`Notizen zu ${m.shortName || m.name}`}
          rows={3}
        />
      </Card>
      <UnitsCard moduleId={m.id} units={view.units} today={today} />
    </div>
  )
}

function BackLink() {
  return (
    <Link to="/uni" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
      <ChevronLeft className="size-4" /> Alle Module
    </Link>
  )
}

function Fact({ label, children, tone }: { label: string; children: ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={cx('truncate text-sm font-medium tabular-nums', tone ?? 'text-zinc-100')}>{children}</div>
    </div>
  )
}

function ProgressCard({ view, today, bufferDays }: { view: ModuleView; today: DateStr; bufferDays: number }) {
  const p = view.progress
  const perWeek = formatPerWeek(p)
  const targetFromExam = p.examDate != null && p.targetDate < p.examDate && diffDays(p.examDate, p.targetDate) === bufferDays
  return (
    <Card title="Fortschritt">
      {p.total > 0 ? (
        <IstSollBar progress={p} size="lg" />
      ) : (
        <p className="text-sm text-zinc-400">Lege unten Lerneinheiten an, dann siehst du hier Ist und Soll.</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Fact label="Ist">{pct(p.ist)}</Fact>
        <Fact label="Soll heute">{pct(p.soll)}</Fact>
        <Fact
          label="Abweichung"
          tone={p.deviationPp == null ? undefined : p.status === 'behind' ? 'text-rose-300' : p.status === 'ahead' ? 'text-emerald-300' : 'text-sky-300'}
        >
          {p.deviationPp == null ? '–' : `${p.deviationPp > 0 ? '+' : p.deviationPp < 0 ? '−' : '±'}${Math.abs(p.deviationPp).toLocaleString('de-DE', { maximumFractionDigits: 1 })} pp`}
        </Fact>
        <Fact label="Einheiten">
          {p.done}/{p.total} <span className="font-normal text-zinc-500">({p.open} offen)</span>
        </Fact>
        <Fact label="Nötiges Tempo" tone={p.status === 'behind' ? 'text-rose-300' : undefined}>
          {perWeek ?? '–'}
        </Fact>
        <Fact label="Zieldatum (100 %)">
          {fmt(p.targetDate, 'dd.MM.')}
          <span className="font-normal text-zinc-500"> · {daysUntil(p.targetDate, today)}</span>
        </Fact>
        <Fact label="Gelernt im Semester">{formatHM(view.studyMinutes)} h</Fact>
        <Fact label="Gelernt diese Woche">{formatHM(view.studyMinutesWeek)} h</Fact>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        {targetFromExam
          ? `Zieldatum = Klausur minus ${bufferDays} Tage Puffer.`
          : 'Zieldatum = „alles fertig bis“ aus den Semester-Einstellungen.'}{' '}
        Lernzeit trägst du im Tages-Panel ein.
      </p>
    </Card>
  )
}

function ExamCard({ module: m }: { module: Module }) {
  const [date, setDate] = useState(m.examDate ?? '')
  const [time, setTime] = useState(m.examTime ?? '')
  const today = useToday()
  const dirty = date !== (m.examDate ?? '') || time !== (m.examTime ?? '')
  const valid = date === '' || isValidDateStr(date)

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    void uniRepo.updateModule(m.id, { examDate: date || null, examTime: date && time ? time : null })
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <CalendarClock className="size-4 text-rose-300" /> Klausur
        </span>
      }
      action={
        m.examDate ? (
          <span className="text-xs text-zinc-400">
            {examText({ examDate: m.examDate, daysToExam: diffDays(m.examDate, today) }, m.examTime)}
          </span>
        ) : (
          <span className="text-xs text-zinc-500">Termin offen</span>
        )
      }
    >
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Klausurdatum" className="w-auto" />
        <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Uhrzeit" className="w-28" disabled={!date} />
        <Button type="submit" variant="primary" disabled={!dirty || !valid}>
          <Check className="size-4" /> Speichern
        </Button>
        {m.examDate && (
          <Button
            variant="ghost"
            onClick={() => {
              setDate('')
              setTime('')
              void uniRepo.updateModule(m.id, { examDate: null, examTime: null })
            }}
          >
            Entfernen
          </Button>
        )}
      </form>
    </Card>
  )
}

function UnitsCard({ moduleId, units, today }: { moduleId: string; units: StudyUnit[]; today: DateStr }) {
  const [mode, setMode] = useState<'single' | 'series' | 'list' | null>(units.length === 0 ? 'series' : null)
  const groups = UNIT_TYPES.map((type) => ({ type, items: units.filter((u) => u.type === type) })).filter((g) => g.items.length > 0)

  return (
    <Card
      title="Lerneinheiten"
      action={
        <div className="flex gap-1">
          <Button variant={mode === 'single' ? 'secondary' : 'ghost'} onClick={() => setMode(mode === 'single' ? null : 'single')}>
            <Plus className="size-4" /> Einheit
          </Button>
          <Button variant={mode === 'series' ? 'secondary' : 'ghost'} onClick={() => setMode(mode === 'series' ? null : 'series')}>
            <ListPlus className="size-4" /> Serie
          </Button>
          <Button variant={mode === 'list' ? 'secondary' : 'ghost'} onClick={() => setMode(mode === 'list' ? null : 'list')}>
            <ClipboardList className="size-4" /> Liste
          </Button>
        </div>
      }
    >
      {mode === 'single' && <AddUnitForm moduleId={moduleId} />}
      {mode === 'series' && <AddSeriesForm moduleId={moduleId} onDone={() => setMode(null)} />}
      {mode === 'list' && <PasteListForm moduleId={moduleId} today={today} onDone={() => setMode(null)} />}

      {groups.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">
          Noch keine Einheiten. Mit „Serie“ legst du z. B. „Übungsblatt 1–12“ auf einmal an, mit „Liste“ fügst du eine
          Kapitelliste ein (eine Einheit pro Zeile).
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {groups.map((g) => (
            <div key={g.type}>
              <div className="mb-1 flex items-center justify-between text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                <span>{UNIT_TYPE_PLURAL[g.type]}</span>
                <span className="tabular-nums">
                  {g.items.filter((u) => u.doneDate).length}/{g.items.length}
                </span>
              </div>
              <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
                {g.items.map((u) => (
                  <UnitRow key={u.id} unit={u} today={today} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function TypeSelect({ value, onChange }: { value: StudyUnitType; onChange: (t: StudyUnitType) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as StudyUnitType)}
      aria-label="Typ"
      className="min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
    >
      {UNIT_TYPES.map((t) => (
        <option key={t} value={t}>
          {UNIT_TYPE_LABEL[t]}
        </option>
      ))}
    </select>
  )
}

function AddUnitForm({ moduleId }: { moduleId: string }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<StudyUnitType>('script')
  const [due, setDue] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    void uniRepo.createStudyUnit(moduleId, { title, type, dueDate: isValidDateStr(due) ? due : null })
    setTitle('')
    setDue('')
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl bg-zinc-950/50 p-3">
      <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Kapitel 3: Kinetik" aria-label="Titel" autoFocus />
      <div className="flex flex-wrap items-center gap-2">
        <TypeSelect value={type} onChange={setType} />
        <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Fällig am (optional)" className="w-auto" />
        <Button type="submit" variant="primary" disabled={!title.trim()} className="ml-auto">
          <Plus className="size-4" /> Anlegen
        </Button>
      </div>
      <p className="text-xs text-zinc-500">Fälligkeit ist optional, z. B. für Abgaben von Übungsblättern.</p>
    </form>
  )
}

function AddSeriesForm({ moduleId, onDone }: { moduleId: string; onDone: () => void }) {
  const [prefix, setPrefix] = useState('Übungsblatt')
  const [type, setType] = useState<StudyUnitType>('sheet')
  const [from, setFrom] = useState('1')
  const [to, setTo] = useState('12')
  const a = Number(from)
  const b = Number(to)
  const valid = prefix.trim() !== '' && Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= a && b - a < 100

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    await uniRepo.createStudyUnitSeries(moduleId, prefix, a, b, type)
    onDone()
  }

  const presets: [string, StudyUnitType][] = [
    ['Übungsblatt', 'sheet'],
    ['Kapitel', 'script'],
    ['Probeklausur', 'mock_exam'],
  ]

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-2 rounded-xl bg-zinc-950/50 p-3">
      <div className="flex flex-wrap gap-2">
        {presets.map(([p, t]) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPrefix(p)
              setType(t)
            }}
            className={cx(
              'min-h-8 rounded-full border px-3 text-sm',
              prefix === p ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-zinc-700 text-zinc-300',
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TextInput value={prefix} onChange={(e) => setPrefix(e.target.value)} aria-label="Bezeichnung" className="w-40" />
        <TextInput inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="von" className="w-14 text-center" />
        <span className="text-zinc-500">bis</span>
        <TextInput inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} aria-label="bis" className="w-14 text-center" />
        <TypeSelect value={type} onChange={setType} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-500">
          {valid ? `Legt ${b - a + 1} Einheiten an: „${prefix.trim()} ${a}“ … „${prefix.trim()} ${b}“` : 'Bitte Bezeichnung und Bereich prüfen.'}
        </span>
        <Button type="submit" variant="primary" disabled={!valid} className="shrink-0">
          <ListPlus className="size-4" /> Anlegen
        </Button>
      </div>
    </form>
  )
}

function PasteListForm({ moduleId, today, onDone }: { moduleId: string; today: DateStr; onDone: () => void }) {
  const [text, setText] = useState('')
  const [defaultType, setDefaultType] = useState<StudyUnitType>('script')
  const parsed = parseUnitList(text, defaultType)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (parsed.length === 0) return
    await uniRepo.createStudyUnits(moduleId, parsed, today)
    onDone()
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-2 rounded-xl bg-zinc-950/50 p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        autoFocus
        aria-label="Liste der Lerneinheiten"
        placeholder={'Eine Einheit pro Zeile, z. B.\nKapitel 1: Grundlagen\n[x] Kapitel 2: Messverfahren\nÜbungsblatt 3\nProbeklausur WS 25/26\nSonstiges: Formelzettel'}
        className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
        <span>Ohne Schlüsselwort als</span>
        <TypeSelect value={defaultType} onChange={setDefaultType} />
      </div>
      <p className="text-xs leading-relaxed text-zinc-500">
        Typ wird erkannt an „Kapitel …“, „Übungsblatt …“/„Übungsaufgaben …“, „Probeklausur …“ oder einem Präfix wie
        „Sonstiges:“. „[x]“ oder „✓“ am Anfang = schon erledigt.
      </p>
      {parsed.length > 0 && (
        <ul className="max-h-56 divide-y divide-zinc-800 overflow-y-auto rounded-lg border border-zinc-800">
          {parsed.map((u, i) => (
            <li key={i} className="flex items-center gap-2 px-3 py-1.5 text-sm">
              <span className={cx('size-2 shrink-0 rounded-full', u.done ? 'bg-emerald-400' : 'bg-zinc-700')} />
              <span className={cx('min-w-0 flex-1 truncate', u.done && 'text-zinc-400')}>{u.title}</span>
              <span className="shrink-0 text-xs text-zinc-500">{UNIT_TYPE_LABEL[u.type]}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={parsed.length === 0}>
          <ClipboardList className="size-4" />
          {parsed.length === 0 ? 'Anlegen' : `${parsed.length} ${parsed.length === 1 ? 'Einheit' : 'Einheiten'} anlegen`}
        </Button>
      </div>
    </form>
  )
}

function UnitRow({ unit, today }: { unit: StudyUnit; today: DateStr }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [title, setTitle] = useState(unit.title)
  const [type, setType] = useState(unit.type)
  const [due, setDue] = useState(unit.dueDate ?? '')
  const done = unit.doneDate != null
  const overdue = !done && unit.dueDate != null && unit.dueDate < today

  if (confirming) {
    return (
      <li>
        <ConfirmBar
          text={`„${unit.title}“ löschen?`}
          confirmLabel="Löschen"
          danger
          onConfirm={() => void uniRepo.deleteStudyUnit(unit.id)}
          onCancel={() => setConfirming(false)}
        />
      </li>
    )
  }

  if (editing) {
    return (
      <li className="space-y-2 bg-zinc-950/40 p-3">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Titel" autoFocus />
        <div className="flex flex-wrap items-center gap-2">
          <TypeSelect value={type} onChange={setType} />
          <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Fällig am" className="w-auto" />
        </div>
        <div className="flex justify-between gap-2">
          <Button variant="danger" onClick={() => setConfirming(true)}>
            <Trash2 className="size-4" /> Löschen
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              <X className="size-4" />
            </Button>
            <Button
              variant="primary"
              disabled={!title.trim()}
              onClick={() => {
                void uniRepo.updateStudyUnit(unit.id, { title, type, dueDate: isValidDateStr(due) ? due : null })
                setEditing(false)
              }}
            >
              <Check className="size-4" /> Speichern
            </Button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 py-1.5 pr-1 pl-3">
      <CheckCircle
        checked={done}
        onToggle={() => void uniRepo.setStudyUnitDone(unit.id, !done, today)}
        label={`${unit.title} ${done ? 'als offen markieren' : 'erledigt'}`}
      />
      <div className="min-w-0 flex-1">
        <div className={cx('text-sm leading-snug break-words', done ? 'text-zinc-500 line-through' : 'text-zinc-100')}>{unit.title}</div>
        {(unit.dueDate || done) && (
          <div className="text-xs">
            {done ? (
              <span className="text-zinc-500">erledigt am {fmt(unit.doneDate!, 'dd.MM.')}</span>
            ) : (
              <span className={overdue ? 'font-medium text-rose-400' : 'text-amber-300/90'}>
                fällig {fmt(unit.dueDate!, 'EE dd.MM.')} · {daysUntil(unit.dueDate!, today)}
              </span>
            )}
          </div>
        )}
      </div>
      <IconButton
        label="Bearbeiten"
        onClick={() => {
          setTitle(unit.title)
          setType(unit.type)
          setDue(unit.dueDate ?? '')
          setEditing(true)
        }}
      >
        <Pencil className="size-4" />
      </IconButton>
    </li>
  )
}
