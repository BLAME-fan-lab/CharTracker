/**
 * Dauer-Eingaben: intern immer ganze Minuten.
 * Akzeptiert „1:30“, „1h30“, „1h“, „45m“, „1,5“ (Stunden), „90“ (Minuten, wenn unit = 'min').
 */
export function parseDuration(input: string, bareNumberUnit: 'h' | 'min' = 'min'): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, '')
  if (s === '') return 0

  let m = /^(\d{1,3}):([0-5]?\d)$/.exec(s)
  if (m) return Number(m[1]) * 60 + Number(m[2])

  m = /^(\d{1,3})h(?:([0-5]?\d)(?:m|min)?)?$/.exec(s)
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0)

  m = /^(\d{1,4})(?:m|min)$/.exec(s)
  if (m) return Number(m[1])

  m = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(s)
  if (m) {
    const value = Number(`${m[1]}.${m[2] ?? '0'}`)
    return Math.round(bareNumberUnit === 'h' ? value * 60 : value)
  }
  return null
}

/** 90 → „1:30“ */
export function formatHM(minutes: number): string {
  const sign = minutes < 0 ? '−' : ''
  const abs = Math.abs(Math.round(minutes))
  return `${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`
}

/** 90 → „1 h 30 min“, 45 → „45 min“, 120 → „2 h“ */
export function formatDurationLong(minutes: number): string {
  const abs = Math.abs(Math.round(minutes))
  const h = Math.floor(abs / 60)
  const min = abs % 60
  if (h === 0) return `${min} min`
  if (min === 0) return `${h} h`
  return `${h} h ${min} min`
}
