import { STATUS_LABEL, type ModuleProgress, type ModuleStatus } from '../../domain/uni'
import { cx } from '../../lib/cx'

const STATUS_STYLE: Record<ModuleStatus, { pill: string; bar: string }> = {
  ahead: { pill: 'bg-emerald-500/15 text-emerald-300', bar: 'bg-emerald-500' },
  on_track: { pill: 'bg-sky-500/15 text-sky-300', bar: 'bg-sky-500' },
  behind: { pill: 'bg-rose-500/15 text-rose-300', bar: 'bg-rose-500' },
  no_units: { pill: 'bg-zinc-800 text-zinc-400', bar: 'bg-zinc-600' },
  done: { pill: 'bg-emerald-500/15 text-emerald-300', bar: 'bg-emerald-400' },
}

/** Prozentpunkte; unter 10 mit einer Nachkommastelle, damit Werte nahe der Toleranzgrenze eindeutig sind. */
const pp = (v: number) =>
  `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toLocaleString('de-DE', { maximumFractionDigits: Math.abs(v) < 10 ? 1 : 0 })} pp`

export function StatusPill({ progress, className }: { progress: ModuleProgress; className?: string }) {
  const s = STATUS_STYLE[progress.status]
  const showPp = progress.deviationPp != null && progress.status !== 'done'
  return (
    <span className={cx('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', s.pill, className)}>
      {STATUS_LABEL[progress.status]}
      {showPp && <span className="tabular-nums opacity-90">{pp(progress.deviationPp!)}</span>}
    </span>
  )
}

/** Ist-Balken mit Soll-Markierung. */
export function IstSollBar({ progress, size = 'md' }: { progress: ModuleProgress; size?: 'md' | 'lg' }) {
  const ist = (progress.ist ?? 0) * 100
  const soll = progress.soll * 100
  return (
    <div className="relative pt-1">
      <div className={cx('overflow-hidden rounded-full bg-zinc-800', size === 'lg' ? 'h-3' : 'h-2')}>
        <div className={cx('h-full rounded-full transition-[width]', STATUS_STYLE[progress.status].bar)} style={{ width: `${ist}%` }} />
      </div>
      <div
        className="absolute top-0 bottom-[-4px] w-0.5 -translate-x-1/2 rounded-full bg-zinc-100"
        style={{ left: `${Math.max(0.5, Math.min(99.5, soll))}%` }}
        title={`Soll heute: ${Math.round(soll)} %`}
        aria-hidden="true"
      />
    </div>
  )
}

