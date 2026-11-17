import { AlertTriangle, Check, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, IconButton } from '../../components/ui'
import { uniRepo, type Module, type StudyUnitType } from '../../data'
import { parseImport } from '../../domain/unitList'
import { cx } from '../../lib/cx'
import { fmt, type DateStr } from '../../lib/dates'
import { UNIT_TYPE_LABEL, UNIT_TYPES } from './format'

const EXAMPLE = `# Messtechnik
Vorlesung 1: Grundlagen @ 18.11.
Übung 1 @ 19.11.
[x] Kapitel 2: Messverfahren
Probeklausur 1

# TM2
Kapitel 1: Kinematik`

/** Lerneinheiten für mehrere Module auf einmal einfügen: „# Modul“ als Überschrift, darunter eine Einheit pro Zeile. */
export function ImportSheet({ modules, today, onClose }: { modules: Module[]; today: DateStr; onClose: () => void }) {
  const [text, setText] = useState('')
  const [defaultType, setDefaultType] = useState<StudyUnitType>('script')
  const [replace, setReplace] = useState(false)
  const [result, setResult] = useState<number | null>(null)

  const sections = parseImport(text, modules, defaultType, today)
  const valid = sections.filter((s) => s.moduleId && s.units.length > 0)
  const unknown = sections.filter((s) => !s.moduleId)
  const total = valid.reduce((n, s) => n + s.units.length, 0)
  const nameOf = (id: string) => {
    const m = modules.find((x) => x.id === id)
    return m ? m.shortName || m.name : '?'
  }

  const submit = async () => {
    if (total === 0) return
    const n = await uniRepo.importStudyUnits(
      valid.map((s) => ({ moduleId: s.moduleId!, units: s.units })),
      replace,
      today,
    )
    setResult(n)
    setText('')
  }

  return (
    <Sheet
      label="Lerneinheiten importieren"
      onClose={onClose}
      header={
        <header className="flex items-center gap-2 px-4 py-3">
          <h2 className="flex-1 text-base font-semibold">Lerneinheiten importieren</h2>
          <IconButton label="Schließen" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </header>
      }
    >
      <div className="space-y-3">
        {result != null && (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
            <Check className="size-4" /> {result} Einheiten importiert.
          </p>
        )}
        <p className="text-xs leading-relaxed text-zinc-400">
          Pro Modul eine Überschrift mit „#“ (Kürzel oder Name), darunter eine Einheit pro Zeile. „[x]“ am Anfang = schon
          erledigt, „@ 19.11.“ am Ende = fällig am. Typ wird an „Vorlesung/Kapitel“, „Übung/Aufgabe“, „Probeklausur“ oder
          „Sonstiges:“ erkannt.
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setResult(null)
          }}
          rows={10}
          placeholder={EXAMPLE}
          aria-label="Text zum Importieren"
          className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <span>Ohne Schlüsselwort als</span>
          <select
            value={defaultType}
            onChange={(e) => setDefaultType(e.target.value as StudyUnitType)}
            aria-label="Standardtyp"
            className="min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
          >
            {UNIT_TYPES.map((t) => (
              <option key={t} value={t}>
                {UNIT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
            className="mt-0.5 size-4 accent-emerald-500"
          />
          <span>
            Vorhandene Einheiten der importierten Module vorher löschen
            <span className="block text-xs text-zinc-500">z. B. wenn du eine ältere Liste ersetzen willst</span>
          </span>
        </label>

        {unknown.length > 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Kein passendes Modul für: {unknown.map((s) => `„${s.heading}“`).join(', ')}. Diese Abschnitte werden
              übersprungen. Prüfe die Schreibweise oder lege das Modul in den Einstellungen an.
            </span>
          </p>
        )}

        {valid.map((s) => (
          <div key={s.heading} className="overflow-hidden rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between bg-zinc-950/60 px-3 py-1.5 text-xs font-semibold text-zinc-300">
              <span>
                {nameOf(s.moduleId!)}
                {replace && <span className="ml-2 font-normal text-rose-300">ersetzt vorhandene</span>}
              </span>
              <span className="tabular-nums text-zinc-500">{s.units.length}</span>
            </div>
            <ul className="max-h-48 divide-y divide-zinc-800 overflow-y-auto">
              {s.units.map((u, i) => (
                <li key={i} className="flex items-center gap-2 px-3 py-1 text-sm">
                  <span className={cx('size-2 shrink-0 rounded-full', u.done ? 'bg-emerald-400' : 'bg-zinc-700')} />
                  <span className={cx('min-w-0 flex-1 truncate', u.done && 'text-zinc-400')}>{u.title}</span>
                  {u.dueDate && <span className="shrink-0 text-xs text-amber-300/90 tabular-nums">{fmt(u.dueDate, 'dd.MM.')}</span>}
                  <span className="w-20 shrink-0 text-right text-xs text-zinc-500">{UNIT_TYPE_LABEL[u.type]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Schließen
          </Button>
          <Button variant="primary" disabled={total === 0} onClick={() => void submit()}>
            <Upload className="size-4" />
            {total === 0 ? 'Importieren' : `${total} Einheiten importieren`}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
