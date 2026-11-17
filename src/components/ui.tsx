import { Check } from 'lucide-react'
import { cx } from '../lib/cx'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'


export function Card({ title, action, children, className }: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 sm:p-4', className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold tracking-wide text-zinc-300">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'secondary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
    ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
    danger: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25',
  }
  return (
    <button
      type="button"
      className={cx(
        'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-30',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg bg-zinc-900 p-0.5 ring-1 ring-zinc-800" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            o.value === value ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Runder Abhak-Button. */
export function CheckCircle({
  checked,
  disabled,
  onToggle,
  label,
  size = 'md',
}: {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  label: string
  size?: 'md' | 'lg'
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onToggle}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full border transition-all active:scale-90',
        size === 'md' ? 'size-8' : 'size-9',
        checked
          ? 'border-emerald-400 bg-emerald-500 text-zinc-950'
          : 'border-zinc-700 bg-zinc-900 text-transparent hover:border-zinc-500',
        disabled && 'cursor-not-allowed border-dashed border-zinc-800 bg-transparent opacity-50 hover:border-zinc-800',
      )}
    >
      <Check className={size === 'md' ? 'size-4' : 'size-5'} strokeWidth={3} />
    </button>
  )
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-zinc-800', className)}>
      <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10" role="status" aria-label="Lädt">
      <div className="size-6 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props
  return (
    <input
      {...rest}
      className={cx(
        'min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none',
        // Standard volle Breite, außer es wird eine eigene Breite übergeben
        /(^|\s)(w-|max-w-)/.test(className ?? '') ? '' : 'w-full',
        className,
      )}
    />
  )
}

/** Bestätigung direkt in der Zeile (statt Browser-Dialog, der in PWAs/Einbettungen oft blockiert ist). */
export function ConfirmBar({
  text,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  text: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="animate-fade space-y-2 bg-zinc-950/60 p-3" role="alertdialog" aria-label={text}>
      <p className="text-sm text-zinc-200">{text}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} autoFocus>
          Abbrechen
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
