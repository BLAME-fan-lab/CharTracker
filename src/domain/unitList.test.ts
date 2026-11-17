import { describe, expect, it } from 'vitest'
import { inferDate, matchModule, parseImport, parseUnitList } from './unitList'

const TODAY = '2026-11-17'

describe('parseUnitList', () => {
  it('erkennt Typen, Erledigt-Marker und Aufzählungszeichen', () => {
    const text = `
      - Kapitel 1: Grundlagen
      • [x] Kapitel 2: Messverfahren
      Übungsaufgaben Kapitel 3 (Fehlerrechnung)
      ✓ Übungsblatt 4
      Probeklausur 60 min, alle Kapitel
      Sonstiges: Formel-Doppelseite entwerfen
      [ ] Partielle Integration

      1. Grundlagen
      # Überschrift wird übersprungen
    `
    expect(parseUnitList(text, 'script', TODAY).map(({ title, type, done }) => ({ title, type, done }))).toEqual([
      { title: 'Kapitel 1: Grundlagen', type: 'script', done: false },
      { title: 'Kapitel 2: Messverfahren', type: 'script', done: true },
      { title: 'Übungsaufgaben Kapitel 3 (Fehlerrechnung)', type: 'sheet', done: false },
      { title: 'Übungsblatt 4', type: 'sheet', done: true },
      { title: 'Probeklausur 60 min, alle Kapitel', type: 'mock_exam', done: false },
      { title: 'Formel-Doppelseite entwerfen', type: 'other', done: false },
      { title: 'Partielle Integration', type: 'script', done: false },
      { title: '1. Grundlagen', type: 'script', done: false },
    ])
  })

  it('nutzt den Standardtyp und ignoriert Leerzeilen', () => {
    expect(parseUnitList('\n\nReibung\n  \nSchwingungen', 'other', TODAY)).toEqual([
      { title: 'Reibung', type: 'other', done: false, dueDate: null },
      { title: 'Schwingungen', type: 'other', done: false, dueDate: null },
    ])
  })

  it('Schlüsselwort nur als ganzes Wort', () => {
    expect(parseUnitList('Kapitelübersicht lesen', 'other', TODAY)[0].type).toBe('other')
    expect(parseUnitList('Klausurtermin anmelden', 'other', TODAY)[0].type).toBe('other')
    expect(parseUnitList('Vorlesung 3 nacharbeiten', 'other', TODAY)[0].type).toBe('script')
  })

  it('liest Fälligkeiten am Zeilenende', () => {
    const units = parseUnitList(
      'Übung 1 @ 19.11.\nÜbung 2 @22.11.2026\nKapitel 3 @ 2027-01-12\nProbeklausur @ 05.02.\nÜbung 9 @ 31.02.',
      'script',
      TODAY,
    )
    expect(units.map((u) => [u.title, u.dueDate])).toEqual([
      ['Übung 1', '2026-11-19'],
      ['Übung 2', '2026-11-22'],
      ['Kapitel 3', '2027-01-12'],
      ['Probeklausur', '2027-02-05'],
      ['Übung 9', null],
    ])
  })
})

describe('inferDate', () => {
  it('wählt das Jahr, das am nächsten an heute liegt', () => {
    expect(inferDate(15, 2, null, TODAY)).toBe('2027-02-15')
    expect(inferDate(20, 10, null, TODAY)).toBe('2026-10-20')
    expect(inferDate(1, 3, 27, TODAY)).toBe('2027-03-01')
    expect(inferDate(30, 2, null, TODAY)).toBeNull()
  })
})

describe('Import mehrerer Module', () => {
  const modules = [
    { id: 'tm2', name: 'Technische Mechanik 2', shortName: 'TM2' },
    { id: 'mt', name: 'Messtechnik', shortName: 'Messtechnik' },
    { id: 'ema', name: 'Elektrische Maschinen und Antriebe', shortName: 'EMA' },
    { id: 'et3', name: 'ET3', shortName: 'ET3' },
  ]

  it('ordnet Überschriften Modulen zu', () => {
    expect(matchModule('tm2', modules)).toBe('tm2')
    expect(matchModule('Messtechnik (ET1016)', modules)).toBe('mt')
    expect(matchModule('Elektrische Maschinen und Antriebe', modules)).toBe('ema')
    expect(matchModule('ET3 Feldtheorie', modules)).toBe('et3')
    expect(matchModule('Regelungstechnik', modules)).toBeNull()
  })

  it('teilt den Text in Abschnitte', () => {
    const sections = parseImport(
      'ignoriert\n# Messtechnik\nÜbung 1 @ 19.11.\n[x] Vorlesung 1\n\n## TM2\nKapitel 1\n# Unbekannt\nIrgendwas',
      modules,
      'script',
      TODAY,
    )
    expect(sections.map((s) => [s.heading, s.moduleId, s.units.length])).toEqual([
      ['Messtechnik', 'mt', 2],
      ['TM2', 'tm2', 1],
      ['Unbekannt', null, 1],
    ])
    expect(sections[0].units[1]).toEqual({ title: 'Vorlesung 1', type: 'script', done: true, dueDate: null })
  })
})
