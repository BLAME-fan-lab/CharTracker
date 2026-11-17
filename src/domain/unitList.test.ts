import { describe, expect, it } from 'vitest'
import { parseUnitList } from './unitList'

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
    `
    expect(parseUnitList(text, 'script')).toEqual([
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
    expect(parseUnitList('\n\nReibung\n  \nSchwingungen', 'other')).toEqual([
      { title: 'Reibung', type: 'other', done: false },
      { title: 'Schwingungen', type: 'other', done: false },
    ])
  })

  it('Schlüsselwort nur als ganzes Wort', () => {
    expect(parseUnitList('Kapitelübersicht lesen', 'other')[0].type).toBe('other')
    expect(parseUnitList('Klausurtermin anmelden', 'other')[0].type).toBe('other')
  })
})
