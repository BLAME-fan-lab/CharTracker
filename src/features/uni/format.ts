import type { StudyUnitType } from '../../data'
import type { ModuleProgress } from '../../domain/uni'
import { diffDays, fmt, type DateStr } from '../../lib/dates'

export const UNIT_TYPE_LABEL: Record<StudyUnitType, string> = {
  script: 'Skriptkapitel',
  sheet: 'Übungsblatt',
  mock_exam: 'Probeklausur',
  other: 'Sonstiges',
}

export const UNIT_TYPE_PLURAL: Record<StudyUnitType, string> = {
  script: 'Skriptkapitel',
  sheet: 'Übungsblätter',
  mock_exam: 'Probeklausuren',
  other: 'Sonstiges',
}

export const UNIT_TYPES: StudyUnitType[] = ['script', 'sheet', 'mock_exam', 'other']

export const pct = (v: number | null) => (v == null ? '–' : `${Math.round(v * 100)} %`)

export function formatPerWeek(p: ModuleProgress): string | null {
  if (p.open === 0) return null
  if (p.unitsPerWeek == null) return p.examPassed ? null : 'Frist erreicht'
  if (p.daysRemaining < 7) return `${p.open} ${p.open === 1 ? 'Einheit' : 'Einheiten'} in ${p.daysRemaining} ${p.daysRemaining === 1 ? 'Tag' : 'Tagen'}`
  const v = p.unitsPerWeek.toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: p.unitsPerWeek < 10 ? 1 : 0 })
  return `${v} Einheiten/Woche`
}

export function examText(p: Pick<ModuleProgress, 'examDate' | 'daysToExam'>, examTime: string | null): string {
  if (!p.examDate) return 'Klausur: Termin offen'
  if (p.daysToExam! < 0) return `Klausur war am ${fmt(p.examDate, 'dd.MM.')}`
  if (p.daysToExam === 0) return `Klausur heute${examTime ? `, ${examTime} Uhr` : ''}`
  return `Klausur in ${p.daysToExam} ${p.daysToExam === 1 ? 'Tag' : 'Tagen'} · ${fmt(p.examDate, 'EE dd.MM.')}`
}

export function daysUntil(date: DateStr, today: DateStr): string {
  const d = diffDays(date, today)
  if (d === 0) return 'heute'
  if (d === 1) return 'morgen'
  if (d < 0) return `vor ${-d} Tagen`
  return `in ${d} Tagen`
}
