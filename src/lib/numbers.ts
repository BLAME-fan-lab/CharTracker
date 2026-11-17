/** Zahl aus deutscher Eingabe („78,5“) – null bei leer/ungültig */
export function parseDecimal(text: string): number | null {
  const s = text.trim().replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export const formatDecimal = (n: number | null | undefined, digits = 1) =>
  n == null ? '' : n.toLocaleString('de-DE', { maximumFractionDigits: digits })

/** „25:30“ oder „1:02:15“ → Sekunden */
export function parseClock(text: string): number | null {
  const parts = text.trim().split(':').map((p) => Number(p))
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !Number.isFinite(p) || p < 0)) return null
  return parts.reduce((acc, p) => acc * 60 + p, 0)
}

export function formatClock(seconds: number): string {
  const s = Math.round(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}
