import { useCallback, useEffect, useRef, useState } from 'react'
import { cx } from '../lib/cx'

/**
 * Textfeld, das sich beim Tippen (nach kurzer Pause), beim Verlassen und beim Schließen selbst speichert.
 * Mit `key` neu einhängen, wenn sich der Bezug (z. B. die Woche) ändert.
 */
export function AutoSaveTextarea({
  initial,
  onSave,
  placeholder,
  label,
  rows = 2,
  className,
}: {
  initial: string
  onSave: (text: string) => void
  placeholder?: string
  label: string
  rows?: number
  className?: string
}) {
  const [text, setText] = useState(initial)
  const latest = useRef(initial)
  const saved = useRef(initial)
  const saveRef = useRef(onSave)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    saveRef.current = onSave
  }, [onSave])

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    if (latest.current !== saved.current) {
      saved.current = latest.current
      saveRef.current(latest.current)
    }
  }, [])

  useEffect(() => flush, [flush])

  return (
    <textarea
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        latest.current = e.target.value
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(flush, 800)
      }}
      onBlur={flush}
      rows={rows}
      placeholder={placeholder}
      aria-label={label}
      className={cx(
        'w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none',
        className,
      )}
    />
  )
}
