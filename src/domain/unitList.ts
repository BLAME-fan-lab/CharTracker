/** Typen wie in data/types.ts – hier als String-Union, damit die Logik unabhängig bleibt. */
export type UnitType = 'script' | 'sheet' | 'mock_exam' | 'other'

export interface ParsedUnit {
  title: string
  type: UnitType
  done: boolean
}

const TYPE_RULES: { re: RegExp; type: UnitType; strip?: boolean }[] = [
  // ausdrückliche Präfixe „Typ: Titel“ werden entfernt
  { re: /^(skript|skriptkapitel)\s*:\s*/i, type: 'script', strip: true },
  { re: /^(übung|uebung|übungsblatt|blatt)\s*:\s*/i, type: 'sheet', strip: true },
  { re: /^(probeklausur|altklausur)\s*:\s*/i, type: 'mock_exam', strip: true },
  { re: /^(sonstiges|sonst)\s*:\s*/i, type: 'other', strip: true },
  // Schlüsselwörter am Anfang bleiben im Titel stehen
  { re: /^(kapitel|kap\.|abschnitt)(\s|$)/i, type: 'script' },
  { re: /^(übungsblatt|uebungsblatt|blatt|übung|uebung|übungsaufgaben|uebungsaufgaben|aufgabenblatt|tutorium)(\s|$)/i, type: 'sheet' },
  { re: /^(probeklausur|altklausur|klausur)(\s|$)/i, type: 'mock_exam' },
]

/**
 * Liest eine eingefügte Liste: eine Einheit pro Zeile.
 * - Aufzählungszeichen (-, •, *, –) am Anfang werden entfernt, Nummern wie „1.“ bleiben.
 * - „[x]“, „✓“ oder „✔“ am Anfang = schon erledigt; „[ ]“ wird ignoriert.
 * - Typ: per Präfix („Sonstiges: …“) oder Schlüsselwort („Kapitel …“, „Übungsblatt …“, „Probeklausur …“),
 *   sonst `defaultType`.
 */
export function parseUnitList(text: string, defaultType: UnitType): ParsedUnit[] {
  const result: ParsedUnit[] = []
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim().replace(/^[-•*–]\s+/, '')
    let done = false
    const mark = /^(\[\s*[xX]\s*\]|✓|✔|☑)\s*/.exec(line)
    if (mark) {
      done = true
      line = line.slice(mark[0].length)
    } else {
      line = line.replace(/^\[\s*\]\s*/, '')
    }
    line = line.trim()
    if (!line) continue

    let type = defaultType
    for (const rule of TYPE_RULES) {
      const m = rule.re.exec(line)
      if (m) {
        type = rule.type
        if (rule.strip) line = line.slice(m[0].length).trim()
        break
      }
    }
    if (line) result.push({ title: line.slice(0, 200), type, done })
  }
  return result
}
