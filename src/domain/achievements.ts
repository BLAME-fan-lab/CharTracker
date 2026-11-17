/*
 * Errungenschaften: werden aus den vorhandenen Daten berechnet (nicht gespeichert).
 * Gespeichert wird nur, wann eine Errungenschaft zum ersten Mal erreicht wurde.
 */

export interface AchievementStats {
  bestPerfectStreak: number
  bestHabitStreak: number
  studyHours: number
  unitsDone: number
  modulesComplete: number
  bestGrade: number | null
  trainings: number
  bestTrainingWeekStreak: number
  /** bestes 1RM Bankdrücken ÷ Körpergewicht */
  benchRatio: number
  pullups: number
  /** höchste erreichte Kraft-Standardstufe über alle Übungen (0 = keine, 1 = Anfänger … 5 = Elite) */
  bestStandard: number
  booksDone: number
  hardBooksDone: number
  bestReadingWeekStreak: number
  musicHours: number
  musicMilestone: number
  projectMilestones: number
  largeMilestones: number
  projectHours: number
  todosDone: number
  characterLevel: number
  maxSkillLevel: number
  hasBackup: boolean
}

export type AchievementCategory = 'routine' | 'uni' | 'sport' | 'reading' | 'music' | 'project' | 'todo' | 'character'

export const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  routine: 'Routinen',
  uni: 'Uni',
  sport: 'Sport',
  reading: 'Lesen',
  music: 'Musik',
  project: 'Projekt',
  todo: 'To-dos',
  character: 'Charakter',
}

export interface Achievement {
  id: string
  category: AchievementCategory
  title: string
  description: string
  /** aktueller Wert und Ziel (für Fortschrittsbalken) */
  progress: (s: AchievementStats) => { current: number; target: number }
}

const at = (target: number, value: (s: AchievementStats) => number) => (s: AchievementStats) => ({
  current: value(s),
  target,
})

export const ACHIEVEMENTS: Achievement[] = [
  // Routinen
  { id: 'r-perfect-1', category: 'routine', title: 'Erster perfekter Tag', description: 'Alle Tagesziele an einem Tag erfüllt.', progress: at(1, (s) => s.bestPerfectStreak) },
  { id: 'r-perfect-7', category: 'routine', title: 'Perfekte Woche', description: '7 perfekte Tage am Stück.', progress: at(7, (s) => s.bestPerfectStreak) },
  { id: 'r-perfect-30', category: 'routine', title: 'Eiserner Monat', description: '30 perfekte Tage am Stück.', progress: at(30, (s) => s.bestPerfectStreak) },
  { id: 'r-perfect-100', category: 'routine', title: 'Hundert am Stück', description: '100 perfekte Tage am Stück.', progress: at(100, (s) => s.bestPerfectStreak) },
  { id: 'r-streak-365', category: 'routine', title: 'Ein Jahr Disziplin', description: 'Eine Gewohnheit 365 Mal in Folge erfüllt.', progress: at(365, (s) => s.bestHabitStreak) },
  // Uni
  { id: 'u-unit-1', category: 'uni', title: 'Erster Haken', description: 'Die erste Lerneinheit erledigt.', progress: at(1, (s) => s.unitsDone) },
  { id: 'u-unit-50', category: 'uni', title: 'Abarbeiter', description: '50 Lerneinheiten erledigt.', progress: at(50, (s) => s.unitsDone) },
  { id: 'u-unit-150', category: 'uni', title: 'Stoffbezwinger', description: '150 Lerneinheiten erledigt.', progress: at(150, (s) => s.unitsDone) },
  { id: 'u-hours-10', category: 'uni', title: 'Fleißig', description: '10 Stunden gelernt.', progress: at(10, (s) => s.studyHours) },
  { id: 'u-hours-100', category: 'uni', title: 'Hundert Stunden', description: '100 Stunden gelernt.', progress: at(100, (s) => s.studyHours) },
  { id: 'u-hours-500', category: 'uni', title: 'Lernmaschine', description: '500 Stunden gelernt.', progress: at(500, (s) => s.studyHours) },
  { id: 'u-module', category: 'uni', title: 'Modul durch', description: 'Alle Lerneinheiten eines Moduls erledigt.', progress: at(1, (s) => s.modulesComplete) },
  { id: 'u-grade-1', category: 'uni', title: 'Glatte Eins', description: 'Eine Prüfung mit 1,0 bestanden.', progress: at(1, (s) => (s.bestGrade != null && s.bestGrade <= 1.0 ? 1 : 0)) },
  // Sport
  { id: 's-train-1', category: 'sport', title: 'Erstes Training', description: 'Die erste Trainingseinheit eingetragen.', progress: at(1, (s) => s.trainings) },
  { id: 's-train-50', category: 'sport', title: 'Stammgast', description: '50 Trainingseinheiten.', progress: at(50, (s) => s.trainings) },
  { id: 's-train-150', category: 'sport', title: 'Eisenfresser', description: '150 Trainingseinheiten.', progress: at(150, (s) => s.trainings) },
  { id: 's-weeks-4', category: 'sport', title: 'Vier Wochen Plan', description: 'Trainingsplan 4 Wochen in Folge erfüllt.', progress: at(4, (s) => s.bestTrainingWeekStreak) },
  { id: 's-weeks-12', category: 'sport', title: 'Ein Quartal durchgezogen', description: 'Trainingsplan 12 Wochen in Folge erfüllt.', progress: at(12, (s) => s.bestTrainingWeekStreak) },
  { id: 's-bench-bw', category: 'sport', title: 'Körpergewicht gedrückt', description: 'Bankdrücken (1RM) mit deinem Körpergewicht.', progress: at(100, (s) => Math.floor(s.benchRatio * 100)) },
  { id: 's-pull-10', category: 'sport', title: 'Zehn Klimmzüge', description: '10 saubere Klimmzüge am Stück.', progress: at(10, (s) => s.pullups) },
  { id: 's-advanced', category: 'sport', title: 'Fortgeschrittene Kraft', description: 'Eine Übung auf Standard „Fortgeschritten“.', progress: at(4, (s) => s.bestStandard) },
  // Lesen
  { id: 'l-book-1', category: 'reading', title: 'Erstes Buch', description: 'Ein Buch zu Ende gelesen.', progress: at(1, (s) => s.booksDone) },
  { id: 'l-book-10', category: 'reading', title: 'Bücherregal', description: '10 Bücher zu Ende gelesen.', progress: at(10, (s) => s.booksDone) },
  { id: 'l-hard-1', category: 'reading', title: 'Schwere Kost', description: 'Ein schweres Buch zu Ende gelesen.', progress: at(1, (s) => s.hardBooksDone) },
  { id: 'l-weeks-8', category: 'reading', title: 'Leseroutine', description: 'Wochenziel Lesen 8 Wochen in Folge erreicht.', progress: at(8, (s) => s.bestReadingWeekStreak) },
  // Musik
  { id: 'm-notes', category: 'music', title: 'Noten lesen', description: 'Meilenstein „Noten lesen“ erreicht.', progress: at(1, (s) => s.musicMilestone) },
  { id: 'm-hands', category: 'music', title: 'Beidhändig', description: 'Meilenstein „Beidhändig“ erreicht.', progress: at(2, (s) => s.musicMilestone) },
  { id: 'm-hours-10', category: 'music', title: 'Erste Stunden', description: '10 Stunden am Instrument geübt.', progress: at(10, (s) => s.musicHours) },
  { id: 'm-hours-100', category: 'music', title: 'Hundert Stunden Übung', description: '100 Stunden am Instrument geübt.', progress: at(100, (s) => s.musicHours) },
  // Projekt
  { id: 'p-ms-1', category: 'project', title: 'Erster Meilenstein', description: 'Einen Projekt-Meilenstein erreicht.', progress: at(1, (s) => s.projectMilestones) },
  { id: 'p-large', category: 'project', title: 'Großer Wurf', description: 'Einen großen Meilenstein erreicht.', progress: at(1, (s) => s.largeMilestones) },
  { id: 'p-hours-100', category: 'project', title: 'Tüftler', description: '100 Stunden am Projekt gearbeitet.', progress: at(100, (s) => s.projectHours) },
  // To-dos
  { id: 't-done-10', category: 'todo', title: 'Aufgeräumt', description: '10 To-dos erledigt.', progress: at(10, (s) => s.todosDone) },
  { id: 't-done-100', category: 'todo', title: 'Erledigungsprofi', description: '100 To-dos erledigt.', progress: at(100, (s) => s.todosDone) },
  // Charakter
  { id: 'c-level-100', category: 'character', title: 'Lehrling', description: 'Charakterlevel 100.', progress: at(100, (s) => Math.floor(s.characterLevel)) },
  { id: 'c-level-250', category: 'character', title: 'Auf dem Weg', description: 'Charakterlevel 250.', progress: at(250, (s) => Math.floor(s.characterLevel)) },
  { id: 'c-level-500', category: 'character', title: 'Halbzeit', description: 'Charakterlevel 500.', progress: at(500, (s) => Math.floor(s.characterLevel)) },
  { id: 'c-skill-500', category: 'character', title: 'Experte', description: 'Ein Skill-Baum erreicht 500.', progress: at(500, (s) => Math.floor(s.maxSkillLevel)) },
  { id: 'c-skill-700', category: 'character', title: 'Großmeister', description: 'Ein Skill-Baum erreicht 700.', progress: at(700, (s) => Math.floor(s.maxSkillLevel)) },
  { id: 'c-backup', category: 'character', title: 'Gesichert', description: 'Das erste Backup gemacht.', progress: at(1, (s) => (s.hasBackup ? 1 : 0)) },
]

export interface AchievementState {
  achievement: Achievement
  current: number
  target: number
  unlocked: boolean
}

export function evaluateAchievements(stats: AchievementStats): AchievementState[] {
  return ACHIEVEMENTS.map((a) => {
    const { current, target } = a.progress(stats)
    return { achievement: a, current: Math.min(current, target), target, unlocked: current >= target }
  })
}

/** Längste Folge von Perioden mit Erfüllung ≥ 1 (null bricht nicht, zählt aber nicht). */
export function bestFullStreak(series: readonly (number | null)[]): number {
  let best = 0
  let run = 0
  for (const a of series) {
    if (a == null) continue
    if (a >= 1) {
      run++
      best = Math.max(best, run)
    } else run = 0
  }
  return best
}
