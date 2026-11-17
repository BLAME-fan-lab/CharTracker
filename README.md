# Tracker

Persönliche Tracking-App (ein Nutzer): tägliche Gewohnheiten, Wochenziele, To-dos und Uni-Fortschritt.
PWA, mobile-first, Dark Mode, komplett auf Deutsch. Daten liegen lokal im Browser (IndexedDB).

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Unit-Tests (Vitest)
npm run build      # Typprüfung + Produktions-Build nach dist/
npm run lint       # oxlint
```

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Actions auf GitHub Pages
(Repo → Settings → Pages → Source: „GitHub Actions“).

## Architektur

| Ordner | Inhalt |
|---|---|
| `src/lib/` | Datums- und Dauer-Hilfen (`DateStr` = `'YYYY-MM-DD'`, lokale Kalendertage) |
| `src/data/` | Datenschicht: Typen, Dexie-Schema, Startdaten, Repositories, Lese-Hooks |
| `src/domain/` | Reine Fachlogik (Streaks, Erfüllungsgrad, Wochenziele, später Soll/Ist) – mit Tests |
| `src/features/` | Seiten und Bereiche der Oberfläche |
| `src/components/` | Layout und UI-Bausteine |

**Regeln der Datenschicht**

- Die Oberfläche importiert nur aus `src/data` (Repositories + Hooks), nie direkt `db`/Dexie.
- Jeder Datensatz hat `id`, `createdAt`, `updatedAt`, `deletedAt` (Soft-Delete) – Grundlage für einen späteren Sync.
- Tages-Einträge haben deterministische IDs (z. B. `habitId_2026-11-17`), damit zwei Geräte nicht kollidieren.
- Später: Dexie bleibt der Offline-Speicher; ein Supabase-Sync gleicht Änderungen über `updatedAt` ab.
- Trainingseinheiten haben `source` (`manual`/`strong`) und `externalId` für den späteren Strong-CSV-Import.

## Fachliche Regeln

- Woche beginnt Montag. Einträge (Haken, Zeiten, Training) sind nur bis heute möglich, nicht für zukünftige Tage.
- **Zeiteingabe:** Lernen/Projekt in h:mm („1:30“, „1,30“ = 1:30; „1,5“ = 1,5 h; „2“ = 2 h), Lesen in Minuten.
- **Gewohnheiten:** Archivieren statt Löschen; eine Gewohnheit zählt von `activeFrom` bis vor `archivedFrom`.
  Erfüllungsgrad eines Tages = erledigte / an dem Tag aktive Gewohnheiten.
- **Streak:** Tage am Stück; ein heute noch offener Tag bricht die Serie nicht. Gesamt-Streak = „perfekte Tage“
  (alle aktiven Gewohnheiten erledigt).
- **Training:** Soll pro Typ (aktuell 2× Gym + 1× Workout), Extra-Einheiten zählen als „+1“, ersetzen aber keinen anderen Typ.
  Pläne und Sollwerte gelten ab einer Woche; vergangene Wochen behalten ihren Plan.
- **Uni-Soll:** linear ab Vorlesungsbeginn bis zum früheren Datum von (Klausur − Puffer) und Zieldatum
  (WS 26/27: 15.02.2027) auf 100 %. „Im Plan“ = ±5 Prozentpunkte.

## Phasen

1. ✅ Grundgerüst, Datenmodell, Wochenansicht mit Tageszielen und Streaks, Tages-Panel, Einstellungen für Gewohnheiten
2. ✅ Wochenziele (Training, Lesen, Lernen, Projekt) + Monatsansicht mit Heatmap
3. To-do-Dashboard
4. Uni-Bereich mit Soll/Ist-Logik
5. PWA/Offline, Export/Import, Feinschliff

Später: Strong-CSV-Import (Workouts, Gewichtsverlauf, PRs), Sync über Supabase.
