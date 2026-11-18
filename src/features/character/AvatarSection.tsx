import { Eye, Lock, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { settingsRepo } from '../../data'
import { AVATAR_PATH_LABEL, AVATAR_UNLOCKS, avatarState, unlockLabel } from '../../domain/avatar'
import { cx } from '../../lib/cx'
import { Avatar } from './Avatar'
import { useAvatarPath } from './useAvatarPath'

const pad = (n: number) => String(n).padStart(3, '0')

/** Bühne mit dem Avatar (schwarz-weiß) und optionalem Vorschau-Regler */
export function AvatarStage({
  level,
  preview,
  onPreview,
}: {
  level: number
  preview: number | null
  onPreview: (level: number | null) => void
}) {
  const shown = preview ?? level
  const state = avatarState(shown)
  const path = useAvatarPath()

  return (
    <div className="bg-black">
      <div className="relative">
        <Avatar c={state.counts} path={path} className="mx-auto block h-auto w-full max-w-[19rem]" />
        <div className="pointer-events-none absolute inset-x-3 top-2.5 flex items-start justify-between font-mono text-[10px] tracking-[0.2em] text-zinc-300 uppercase">
          <span>
            {preview != null ? 'Vorschau' : 'Held'} · Lvl {pad(Math.floor(shown))}
          </span>
          <span>Stufe {state.step}/99</span>
        </div>
        <button
          type="button"
          onClick={() => onPreview(preview == null ? Math.floor(level / 10) * 10 : null)}
          className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-black/80 px-2 py-1 font-mono text-[10px] tracking-widest text-zinc-300 uppercase hover:border-zinc-400 hover:text-white"
          aria-pressed={preview != null}
        >
          {preview != null ? <RotateCcw className="size-3" /> : <Eye className="size-3" />}
          {preview != null ? 'Jetzt' : 'Vorschau'}
        </button>
      </div>
      {preview != null && (
        <div className="border-t border-zinc-800 px-4 pt-2 pb-3">
          <input
            type="range"
            min={0}
            max={990}
            step={10}
            value={Math.floor(preview / 10) * 10}
            onChange={(e) => onPreview(Number(e.target.value))}
            className="w-full accent-white"
            aria-label="Vorschau-Level"
          />
          <div className="mt-0.5 flex justify-between font-mono text-[10px] text-zinc-500">
            <span>0</span>
            <span>500</span>
            <span>990</span>
          </div>
        </div>
      )}
    </div>
  )
}

/** Inventar: freigeschaltete Ausrüstung, nächste Verwandlung, Rest gesperrt */
export function AvatarInventory({ level, onPreview }: { level: number; onPreview: (level: number) => void }) {
  const [all, setAll] = useState(false)
  const path = useAvatarPath()
  const state = avatarState(level)
  const into = level - state.step * 10
  const items = all
    ? AVATAR_UNLOCKS
    : AVATAR_UNLOCKS.filter((u) => u.step > state.step - 3 && u.step <= state.step + 3)

  return (
    <section className="rounded-2xl border border-zinc-800 bg-black p-3 font-mono sm:p-4">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs tracking-[0.2em] text-zinc-200 uppercase">Ausrüstung · {state.unlocked.length}/99</h2>
        <button type="button" onClick={() => setAll((v) => !v)} className="text-[11px] tracking-wider text-zinc-400 uppercase hover:text-white">
          {all ? 'Weniger' : 'Alle anzeigen'}
        </button>
      </header>

      {state.next ? (
        <div className="mb-3">
          <div className="flex justify-between gap-2 text-[11px] text-zinc-400">
            <span>Nächste Verwandlung bei Level {state.next.step * 10}</span>
            <span className="tabular-nums">noch {Math.max(1, Math.ceil(10 - into))}</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden bg-zinc-900">
            <div className="h-full bg-zinc-100" style={{ width: `${Math.min(100, into * 10)}%` }} />
          </div>
        </div>
      ) : (
        <p className="mb-3 text-[11px] text-zinc-300">Alle Verwandlungen freigeschaltet.</p>
      )}

      <ul className={cx('grid gap-x-4 gap-y-1 text-xs', all && 'sm:grid-cols-2')}>
        {items.map((u) => {
          const got = u.step <= state.step
          const isNext = u.step === state.step + 1
          return (
            <li key={u.step}>
              <button
                type="button"
                onClick={() => onPreview(u.step * 10)}
                className={cx(
                  'flex w-full items-center gap-2 py-0.5 text-left hover:text-white',
                  got ? 'text-zinc-100' : isNext ? 'text-zinc-400' : 'text-zinc-600',
                )}
                title="In der Vorschau ansehen"
              >
                <span className="w-9 shrink-0 tabular-nums text-zinc-500">{pad(u.step * 10)}</span>
                {got ? <span className="size-1.5 shrink-0 bg-zinc-100" /> : <Lock className="size-3 shrink-0" />}
                <span className="min-w-0 truncate">{got || isNext ? unlockLabel(u, path) : '???'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3">
        <span className="text-[11px] text-zinc-400">Verschmelzung ab Level 800</span>
        <div className="flex overflow-hidden rounded-md border border-zinc-700 text-[11px] tracking-wider uppercase" role="group" aria-label="Pfad der Verschmelzung">
          {(['spirit', 'demon'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={path === p}
              onClick={() => void settingsRepo.updateSettings({ avatarPath: p })}
              className={cx('px-2.5 py-1', path === p ? 'bg-zinc-100 text-black' : 'text-zinc-400 hover:text-white')}
            >
              {AVATAR_PATH_LABEL[p]}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
        Alle 10 Charakterlevel wird dein Held ein Stück stärker: neue Ausrüstung, Magie, Begleiter und am Ende die Verschmelzung. Antippen zeigt
        die Stufe in der Vorschau.
      </p>
    </section>
  )
}
