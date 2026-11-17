import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '../lib/cx'

/**
 * Overlay: am Handy als Sheet von unten, am Laptop als Seitenleiste rechts.
 * Schließt mit Escape und per Klick auf den Hintergrund.
 */
export function Sheet({
  label,
  onClose,
  header,
  children,
}: {
  label: string
  onClose: () => void
  header: ReactNode
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cx(
          'animate-sheet absolute flex flex-col bg-zinc-900 shadow-2xl outline-none',
          'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t border-zinc-800',
          'md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[420px] md:rounded-none md:border-l md:border-t-0',
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-zinc-700 md:hidden" aria-hidden="true" />
        {header}
        <div className="pb-safe flex-1 overflow-y-auto px-4 pb-8">{children}</div>
      </div>
    </div>
  )
}
