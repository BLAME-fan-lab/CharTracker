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
(Repo → Settings → Pages → Source: „GitHub Actions“): https://blame-fan-lab.github.io/CharTracker/

## Installieren und Backup

- **iPhone (Safari):** Teilen → „Zum Home-Bildschirm“. **Android/Chrome:** Menü → „App installieren“.
- Die App läuft danach offline (Service Worker, vite-plugin-pwa). Neue Versionen werden mit „Neu laden“ übernommen.
- **Backup:** Einstellungen → Daten & App. Export als JSON-Datei, über „Teilen“ oder in die Zwischenablage.
  Wiederherstellen per Datei oder eingefügtem Text, wahlweise *Ersetzen* oder *Zusammenführen*
  (gleiche IDs: neuerer `updatedAt` gewinnt – dieselbe Regel wie ein späterer Sync).
- Die App erinnert in der Wochenansicht, wenn das letzte Backup älter als 7 Tage ist.

## Architektur

| Ordner | Inhalt |
|---|---|
| `src/lib/` | Datums- und Dauer-Hilfen (`DateStr` = `'YYYY-MM-DD'`, lokale Kalendertage) |
| `src/data/` | Datenschicht: Typen, Dexie-Schema, Startdaten, Repositories, Lese-Hooks |
| `src/domain/` | Reine Fachlogik (Streaks, Wochenziele, Soll/Ist, Charakter-Level) – mit Tests |
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
- **Uni-Soll:** linear ab Vorlesungsbeginn bis zum früheren Datum von (Klausur − Puffer) und „alles fertig bis“
  (WS 26/27: 15.02.2027) auf 100 %; ohne Klausurtermin gilt „alles fertig bis“. Optional steht das Soll in Pausen still.
  Ist = erledigte / alle Einheiten. „Im Plan“ = Abweichung höchstens ±5 Prozentpunkte (einstellbar).
  Nötiges Tempo = offene Einheiten ÷ verbleibende Tage bis zum Zieldatum (danach bis zur Klausur) × 7.
  Sortierung nach Rückstand oder Klausurtermin; Module ohne Einheiten, fertige und vergangene stehen am Ende.

## Lerneinheiten importieren

Uni → „Importieren“: pro Modul eine Überschrift `# Kürzel`, darunter eine Einheit pro Zeile.
`[x]` am Anfang = erledigt, `@ 19.11.` am Ende = fällig. Typ per Schlüsselwort (Kapitel/Vorlesung, Übung/Aufgabe,
Probeklausur) oder Präfix (`Sonstiges:`).

## Phasen

1. ✅ Grundgerüst, Datenmodell, Wochenansicht mit Tageszielen und Streaks, Tages-Panel, Einstellungen für Gewohnheiten
2. ✅ Wochenziele (Training, Lesen, Lernen, Projekt) + Monatsansicht mit Heatmap
3. ✅ To-do-Dashboard (Filter, Sortierung, Kategorien; To-dos in Woche, Monat und Tages-Panel)
4. ✅ Uni-Bereich mit Soll/Ist-Logik (Übersicht, Modul-Detail, Lerneinheiten inkl. Serien, Semester-/Modul-Einstellungen, Termine in Woche/Monat/Tag)
5. ✅ PWA (installierbar, offline), Backup per Export/Import (Datei, Teilen, Kopieren; Ersetzen oder Zusammenführen), Backup-Erinnerung, Update-Hinweis

6. ✅ Charakter (6a): 7 Skill-Bäume auf einer Skala 0–1000, Charakterlevel = Durchschnitt
   - Akademisch: ECTS-gewichteter Notenschnitt (1,0 → 1000, 4,0 → 250) × Studienfortschritt (60 ECTS → 63 %, 180 → 95 %)
   - Sportlich: 60 % Leistung (1RM bzw. Klimmzüge relativ zum Körpergewicht gegen Kraft-Standards, 5-km-Zeit) + 40 % Trainingskonstanz
   - Gesundheit: 70 % Routinen-Disziplin + 30 % Körperwerte (BMI, Körperfett)
   - Hygiene & Pflege: Routinen-Disziplin (1 Jahr durchgehend → 900, Nachlassen senkt halb so schnell)
   - Lesen: Obergrenze nach Schwierigkeits-Mix × (70 % Volumen + 30 % Wochenziel-Disziplin)
   - Musikalisch: Meilenstein-Leiter Klavier + Übungsstunden
   - Projekt: Stunden, Meilensteine (klein/mittel/groß), Konstanz
   - Gewohnheiten können nur an bestimmten Wochentagen gelten (z. B. samstags)
7. ✅ Belohnungen (6b): Ränge je 100 Level (Novize … Legende), Skill-Netz (Siebeneck), Rang-Pfad pro Baum,
   40 Errungenschaften (aus den Daten berechnet, Datum der ersten Erreichung gespeichert),
   Level-Up-Feier bei Rangaufstieg/Errungenschaft und Hinweis bei steigendem Charakterlevel
8. ✅ Avatar (6c): eigener Ritter-Magier im Manga-Linienstil (SVG, schwarz-weiß, Strichschraffur).
   Alle 10 Charakterlevel ein neues Teil (99 Stufen bis Level 990, `domain/avatar.ts`): Schwert, Rüstung,
   schwebendes Grimoire, Magiekreise, Waldgeister, Dämonen, Burg und Wald. Ab Level 800 Verschmelzung mit
   einem Waldgeist oder Dämon (Pfad unter der Ausrüstungsliste wählbar), Level 990: Magierkönig.
   Vorschau-Regler, Ausrüstungsliste und eigene Feier beim Überschreiten einer 10er-Grenze.
   Animationen (schwebendes Grimoire, Atmen, Wind, Nebel, Funken, Flügelschlag) entfallen bei „Bewegung reduzieren“.

Später: Strong-CSV-Import (Workouts, Gewichtsverlauf, PRs), Sync über Supabase.
