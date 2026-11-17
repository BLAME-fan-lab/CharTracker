/**
 * Dauer-Eingaben: intern immer ganze Minuten.
 *
 * Akzeptiert:
 * - „1:30“, „1.30“, „1,30“ → 1 h 30 min (zwei Ziffern nach dem Trenner = Minuten)
 * - „1,5“ / „1.5“         → 1,5 h = 90 min (eine Ziffer = Dezimalstunden)
 * - „1h30“, „2h“, „45m“, „45min“
 * - reine Zahl            → je nach `bareUnit` Stunden („2“ = 2:00) oder Minuten („45“ = 45 min)
 */
export function parseDuration(input: string, bareUnit: 'h' | 'min' = 'min'): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, '')
  if (s === '') return 0

  let m = /^(\d{1,3})[:.,](\d{2})$/.exec(s)
  if (m) return Number(m[2]) < 60 ? Number(m[1]) * 60 + Number(m[2]) : null

  m = /^(\d{1,3}):(\d)$/.exec(s)
  if (m) return Number(m[1]) * 60 + Number(m[2])

  m = /^(\d{0,3})[.,](\d)$/.exec(s)
  if (m) return Math.round((Number(m[1] || 0) + Number(m[2]) / 10) * 60)

  m = /^(\d{1,3})h(?:([0-5]?\d)(?:m|min)?)?$/.exec(s)
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0)

  m = /^(\d{1,4})(?:m|min)$/.exec(s)
  if (m) return Number(m[1])

  m = /^(\d{1,4})$/.exec(s)
  if (m) return bareUnit === 'h' ? Number(m[1]) * 60 : Number(m[1])

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

/** Stunden mit höchstens einer Nachkommastelle: 2400 → „40“, 750 → „12,5“ */
export function formatHours(minutes: number): string {
  const h = Math.round((minutes / 60) * 10) / 10
  return h.toLocaleString('de-DE', { maximumFractionDigits: 1 })
}
