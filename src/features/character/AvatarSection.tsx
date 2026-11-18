import { Eye, Lock, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { settingsRepo } from '../../data'
import { AVATAR_PATH_LABEL, AVATAR_UNLOCKS, avatarState, unlockLabel } from '../../domain/avatar'
import { cx } from '../../lib/cx'
import { Avatar } from './Avatar'
import { useAvatarPath } from './useAvatarPath'

const pad = (n: number) => String(n).padStart(3, '0')

/**
 * Bühne mit dem Avatar (schwarz-weiß).
 * Die Vorschau zeigt ausschließlich die nächste Stufe – alles danach bleibt gesperrt.
 */
export function AvatarStage({
  level,
  preview,
  onPreview,
  onBook,
}: {
  level: number
  preview: boolean
  onPreview: (on: boolean) => void
  /** Grimoire bzw. Schwert angetippt */
  onBook?: (kind: 'zauber' | 'technik') => void
}) {
  const path = useAvatarPath()
  const current = avatarState(level)
  const next = current.next
  const showing = preview && next != null
  const shownLevel = showing ? next.step * 10 : level
  const state = showing ? avatarState(shownLevel) : current

  return (
    <div className="bg-black">
      <div className="relative">
        <div className="relative mx-auto w-full max-w-[19rem]">
          <Avatar c={state.counts} path={path} className="block h-auto w-full" />
          {onBook && !showing && (
            <>
              {state.counts.grimoire >= 1 && (
                <button
                  type="button"
                  onClick={() => onBook('zauber')}
                  className="absolute rounded-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  style={{ left: '16.7%', top: '43.6%', width: '18.3%', height: '20.7%' }}
                  aria-label="Zauberbuch öffnen"
                  title="Zauberbuch"
                />
              )}
              <button
                type="button"
                onClick={() => onBook('technik')}
                className="absolute rounded-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                style={
                  state.counts.posture >= 2
                    ? { left: '62.5%', top: '7.1%', width: '27%', height: '28.6%' }
                    : { left: '61.2%', top: '50%', width: '10%', height: '39.3%' }
                }
                aria-label="Kampftechniken öffnen"
                title="Kampftechniken"
              />
            </>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-3 top-2.5 flex items-start justify-between font-mono text-[10px] tracking-[0.2em] text-zinc-300 uppercase">
          <span>
            {showing ? 'Vorschau' : 'Held'} · Lvl {pad(Math.floor(shownLevel))}
          </span>
          <span>Stufe {state.step}/99</span>
        </div>
        {next && (
          <button
            type="button"
            onClick={() => onPreview(!showing)}
            className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-black/80 px-2 py-1 font-mono text-[10px] tracking-widest text-zinc-300 uppercase hover:border-zinc-400 hover:text-white"
            aria-pressed={showing}
          >
            {showing ? <RotateCcw className="size-3" /> : <Eye className="size-3" />}
            {showing ? 'Jetzt' : 'Nächste Stufe'}
          </button>
        )}
      </div>
      {showing && (
        <div className="border-t border-zinc-800 px-4 py-2.5 font-mono text-[11px] text-zinc-400">
          <span className="text-zinc-200">Level {next.step * 10}:</span> {unlockLabel(next, path)}
          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
            <Lock className="size-3" /> Alles danach bleibt gesperrt.
          </span>
        </div>
      )}
    </div>
  )
}

/** Inventar: freigeschaltete Ausrüstung, nächste Verwandlung, Rest gesperrt */
export function AvatarInventory({ level, onPreview }: { level: number; onPreview: () => void }) {
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
          const content = (
            <>
              <span className="w-9 shrink-0 tabular-nums text-zinc-500">{pad(u.step * 10)}</span>
              {got ? <span className="size-1.5 shrink-0 bg-zinc-100" /> : isNext ? <Eye className="size-3 shrink-0" /> : <Lock className="size-3 shrink-0" />}
              <span className="min-w-0 truncate">{got || isNext ? unlockLabel(u, path) : '???'}</span>
            </>
          )
          return (
            <li key={u.step}>
              {isNext ? (
                <button
                  type="button"
                  onClick={onPreview}
                  className="flex w-full items-center gap-2 py-0.5 text-left text-zinc-300 underline decoration-zinc-700 underline-offset-2 hover:text-white"
                  title="Nächste Stufe in der Vorschau ansehen"
                >
                  {content}
                </button>
              ) : (
                <div className={cx('flex w-full items-center gap-2 py-0.5', got ? 'text-zinc-100' : 'text-zinc-600')}>{content}</div>
              )}
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
        Alle 10 Charakterlevel wird dein Held ein Stück stärker: neue Ausrüstung, Magie, Begleiter und am Ende die Verschmelzung. Nur die
        nächste Stufe lässt sich vorab ansehen, alles danach bleibt gesperrt.
      </p>
    </section>
  )
}
