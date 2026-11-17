import { diffDays, isValidDateStr, type DateStr } from '../lib/dates'

/** Typen wie in data/types.ts – hier als String-Union, damit die Logik unabhängig bleibt. */
export type UnitType = 'script' | 'sheet' | 'mock_exam' | 'other'

export interface ParsedUnit {
  title: string
  type: UnitType
  done: boolean
  dueDate: DateStr | null
}

const TYPE_RULES: { re: RegExp; type: UnitType; strip?: boolean }[] = [
  // ausdrückliche Präfixe „Typ: Titel“ werden entfernt
  { re: /^(skript|skriptkapitel)\s*:\s*/i, type: 'script', strip: true },
  { re: /^(übung|uebung|übungsblatt|blatt)\s*:\s*/i, type: 'sheet', strip: true },
  { re: /^(probeklausur|altklausur)\s*:\s*/i, type: 'mock_exam', strip: true },
  { re: /^(sonstiges|sonst)\s*:\s*/i, type: 'other', strip: true },
  // Schlüsselwörter am Anfang bleiben im Titel stehen
  { re: /^(kapitel|kap\.|abschnitt|vorlesung)(\s|$)/i, type: 'script' },
  { re: /^(übungsblatt|uebungsblatt|blatt|übung|uebung|übungsaufgaben|uebungsaufgaben|aufgabenblatt|tutorium)(\s|$)/i, type: 'sheet' },
  { re: /^(probeklausur|altklausur|klausur)(\s|$)/i, type: 'mock_exam' },
]

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * „19.11.“ ohne Jahr: das Jahr, mit dem das Datum am nächsten an heute liegt
 * (so wird im November „15.02.“ zum nächsten Februar).
 */
export function inferDate(day: number, month: number, year: number | null, today: DateStr): DateStr | null {
  if (year != null) {
    const full = year < 100 ? 2000 + year : year
    const s = `${full}-${pad(month)}-${pad(day)}`
    return isValidDateStr(s) && Number(s.slice(8, 10)) === day ? s : null
  }
  const y = Number(today.slice(0, 4))
  const candidates = [y - 1, y, y + 1]
    .map((cy) => `${cy}-${pad(month)}-${pad(day)}`)
    .filter((s) => isValidDateStr(s) && Number(s.slice(8, 10)) === day)
  if (candidates.length === 0) return null
  return candidates.reduce((best, s) => (Math.abs(diffDays(s, today)) < Math.abs(diffDays(best, today)) ? s : best))
}

const DUE_RE = /\s*@\s*(?:(\d{4})-(\d{2})-(\d{2})|(\d{1,2})\.(\d{1,2})\.(\d{2,4})?)\s*$/

/**
 * Liest eine eingefügte Liste: eine Einheit pro Zeile.
 * - Aufzählungszeichen (-, •, *, –) am Anfang werden entfernt, Nummern wie „1.“ bleiben.
 * - „[x]“, „✓“ oder „✔“ am Anfang = schon erledigt; „[ ]“ wird ignoriert.
 * - Typ: per Präfix („Sonstiges: …“) oder Schlüsselwort („Kapitel …“, „Übung …“, „Probeklausur …“), sonst `defaultType`.
 * - Fälligkeit am Zeilenende: „@ 19.11.“, „@ 19.11.2026“ oder „@ 2026-11-19“.
 * - Zeilen, die mit „#“ beginnen (Modul-Überschriften), werden übersprungen.
 */
export function parseUnitList(text: string, defaultType: UnitType, today: DateStr): ParsedUnit[] {
  const result: ParsedUnit[] = []
  for (const raw of text.split(/\r?\n/)) {
    const parsed = parseLine(raw, defaultType, today)
    if (parsed) result.push(parsed)
  }
  return result
}

function parseLine(raw: string, defaultType: UnitType, today: DateStr): ParsedUnit | null {
  let line = raw.trim()
  if (line.startsWith('#')) return null
  line = line.replace(/^[-•*–]\s+/, '')
  let done = false
  const mark = /^(\[\s*[xX]\s*\]|✓|✔|☑)\s*/.exec(line)
  if (mark) {
    done = true
    line = line.slice(mark[0].length)
  } else {
    line = line.replace(/^\[\s*\]\s*/, '')
  }

  let dueDate: DateStr | null = null
  const due = DUE_RE.exec(line)
  if (due) {
    dueDate = due[1]
      ? isValidDateStr(`${due[1]}-${due[2]}-${due[3]}`)
        ? `${due[1]}-${due[2]}-${due[3]}`
        : null
      : inferDate(Number(due[4]), Number(due[5]), due[6] ? Number(due[6]) : null, today)
    line = line.slice(0, due.index)
  }

  line = line.trim()
  if (!line) return null

  let type = defaultType
  for (const rule of TYPE_RULES) {
    const m = rule.re.exec(line)
    if (m) {
      type = rule.type
      if (rule.strip) line = line.slice(m[0].length).trim()
      break
    }
  }
  return line ? { title: line.slice(0, 200), type, done, dueDate } : null
}

export interface ImportSection {
  heading: string
  moduleId: string | null
  units: ParsedUnit[]
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

/** Findet das Modul zu einer Überschrift: exakt (Kürzel oder Name), sonst als Teilstring. */
export function matchModule(heading: string, modules: readonly { id: string; name: string; shortName: string }[]): string | null {
  const h = norm(heading)
  if (!h) return null
  const exact = modules.find((m) => norm(m.shortName) === h || norm(m.name) === h)
  if (exact) return exact.id
  const partial = modules.filter(
    (m) => h.includes(norm(m.shortName)) || h.includes(norm(m.name)) || norm(m.name).includes(h),
  )
  return partial.length === 1 ? partial[0].id : null
}

/**
 * Import für mehrere Module: „# Modulname“ als Überschrift, darunter die Einheiten wie bei parseUnitList.
 * Zeilen vor der ersten Überschrift werden ignoriert.
 */
export function parseImport(
  text: string,
  modules: readonly { id: string; name: string; shortName: string }[],
  defaultType: UnitType,
  today: DateStr,
): ImportSection[] {
  const sections: ImportSection[] = []
  let current: ImportSection | null = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    const heading = /^#+\s*(.*)$/.exec(line)
    if (heading) {
      current = { heading: heading[1].trim(), moduleId: matchModule(heading[1], modules), units: [] }
      sections.push(current)
      continue
    }
    if (!current) continue
    const unit = parseLine(raw, defaultType, today)
    if (unit) current.units.push(unit)
  }
  return sections
}

