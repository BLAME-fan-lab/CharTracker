import { describe, expect, it } from 'vitest'
import {
  addDaysStr,
  addMonthsStr,
  daysInRange,
  diffDays,
  formatWeekRange,
  isoWeek,
  isValidDateStr,
  monthEnd,
  weekDays,
  weekStartOf,
} from './dates'
import { formatHM, parseDuration } from './duration'

describe('dates', () => {
  it('Woche beginnt Montag', () => {
    expect(weekStartOf('2026-11-17')).toBe('2026-11-16') // Dienstag → Montag
    expect(weekStartOf('2026-11-22')).toBe('2026-11-16') // Sonntag → Montag davor
    expect(weekStartOf('2026-11-16')).toBe('2026-11-16')
    expect(weekDays('2026-11-16')).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ])
  })

  it('rechnet über Zeitumstellung und Jahreswechsel', () => {
    expect(addDaysStr('2026-10-24', 2)).toBe('2026-10-26') // Zeitumstellung 25.10.
    expect(diffDays('2026-10-26', '2026-10-24')).toBe(2)
    expect(addDaysStr('2026-12-31', 1)).toBe('2027-01-01')
    expect(daysInRange('2026-12-30', '2027-01-02')).toHaveLength(4)
  })

  it('Kalenderwoche und Monate', () => {
    expect(isoWeek('2026-11-17')).toBe(47)
    expect(monthEnd('2027-02')).toBe('2027-02-28')
    expect(addMonthsStr('2026-12', 1)).toBe('2027-01')
  })

  it('formatiert Wochenbereiche', () => {
    expect(formatWeekRange('2026-11-16')).toBe('16.–22. Nov. 2026')
    expect(formatWeekRange('2026-11-30')).toBe('30. Nov. – 6. Dez. 2026')
    expect(formatWeekRange('2026-12-28')).toBe('28. Dez. 2026 – 3. Jan. 2027')
  })

  it('validiert Datumsstrings', () => {
    expect(isValidDateStr('2026-11-17')).toBe(true)
    expect(isValidDateStr('2026-13-01')).toBe(false)
    expect(isValidDateStr('17.11.2026')).toBe(false)
  })
})

describe('duration', () => {
  it('parst h:mm und Varianten', () => {
    expect(parseDuration('1:30')).toBe(90)
    expect(parseDuration('0:45')).toBe(45)
    expect(parseDuration('2h')).toBe(120)
    expect(parseDuration('1h15')).toBe(75)
    expect(parseDuration('45m')).toBe(45)
    expect(parseDuration('90')).toBe(90)
    expect(parseDuration('1,5', 'h')).toBe(90)
    expect(parseDuration('')).toBe(0)
    expect(parseDuration('abc')).toBeNull()
    expect(parseDuration('1:75')).toBeNull()
  })

  it('formatiert h:mm', () => {
    expect(formatHM(90)).toBe('1:30')
    expect(formatHM(5)).toBe('0:05')
    expect(formatHM(2400)).toBe('40:00')
  })
})
