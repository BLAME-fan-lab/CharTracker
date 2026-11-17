import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cx } from '../lib/cx'
import { formatHM, parseDuration } from '../lib/duration'

/**
 * Zeit-Eingabe mit −/+ und freiem Textfeld.
 * mode 'hm': Anzeige h:mm, reine Zahl = Stunden („2“ → 2:00, „1,30“ → 1:30, „1,5“ → 1:30)
 * mode 'min': Anzeige Minuten, reine Zahl = Minuten
 */
export function DurationStepper({
  value,
  onChange,
  mode,
  step = mode === 'hm' ? 15 : 5,
  disabled,
  label,
}: {
  value: number
  onChange: (minutes: number) => void
  mode: 'hm' | 'min'
  step?: number
  disabled?: boolean
  label: string
}) {
  const format = (v: number) => (v === 0 ? '' : mode === 'hm' ? formatHM(v) : String(v))
  const [text, setText] = useState(() => format(value))
  const [invalid, setInvalid] = useState(false)
  const focused = useRef(false)

  // Werte aus der Datenbank übernehmen, solange nicht getippt wird
  useEffect(() => {
    if (!focused.current) setText(format(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode])

  const commit = () => {
    const parsed = parseDuration(text, mode === 'hm' ? 'h' : 'min')
    if (parsed == null || parsed > 24 * 60) {
      setInvalid(true)
      setText(format(value))
      window.setTimeout(() => setInvalid(false), 1200)
      return
    }
    setText(format(parsed))
    if (parsed !== value) onChange(parsed)
  }

  const bump = (delta: number) => {
    const next = Math.max(0, Math.min(24 * 60, value + delta))
    setText(format(next))
    if (next !== value) onChange(next)
  }

  return (
    <div className={cx('inline-flex items-center gap-1', disabled && 'opacity-40')}>
      <button
        type="button"
        aria-label={`${label}: ${step} min weniger`}
        disabled={disabled || value <= 0}
        onClick={() => bump(-step)}
        className="inline-flex size-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30"
      >
        <Minus className="size-4" />
      </button>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          aria-label={label}
          disabled={disabled}
          value={text}
          placeholder={mode === 'hm' ? '0:00' : '0'}
          onFocus={(e) => {
            focused.current = true
            e.target.select()
          }}
          onBlur={() => {
            focused.current = false
            commit()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          onChange={(e) => setText(e.target.value)}
          className={cx(
            'h-8 rounded-lg border bg-zinc-950 text-center text-sm tabular-nums text-zinc-100 placeholder:text-zinc-600 focus:outline-none',
            mode === 'hm' ? 'w-16' : 'w-14 pr-1',
            invalid ? 'border-rose-500' : 'border-zinc-700 focus:border-emerald-500',
          )}
        />
      </div>
      {mode === 'min' && <span className="text-xs text-zinc-500">min</span>}
      <button
        type="button"
        aria-label={`${label}: ${step} min mehr`}
        disabled={disabled}
        onClick={() => bump(step)}
        className="inline-flex size-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
