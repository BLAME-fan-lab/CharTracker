import { ArrowUp, Medal, Sparkles, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { settingsRepo, useSettings } from '../data'
import { ACHIEVEMENTS, evaluateAchievements } from '../domain/achievements'
import { avatarState, unlockLabel, type AvatarPath } from '../domain/avatar'
import { SKILL_NAMES, type SkillKey } from '../domain/characterSheet'
import { detectProgress, isBigEvent, sameSnapshot, snapshot, type ProgressEvent } from '../domain/progressEvents'
import { Avatar } from '../features/character/Avatar'
import { useCharacter } from '../features/character/useCharacter'
import { cx } from '../lib/cx'
import { useToday } from '../lib/useToday'
import { Button } from './ui'

const CONFETTI_COLORS = ['#34d399', '#fbbf24', '#a78bfa', '#38bdf8', '#fb7185', '#f0abfc', '#fb923c']

/** Feste Pseudo-Zufallsfolge, damit das Konfetti beim Rendern stabil bleibt */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}
const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  left: rnd(i, 1) * 100,
  delay: rnd(i, 2) * 0.6,
  duration: 1.8 + rnd(i, 3) * 1.4,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotate: rnd(i, 4) * 360,
}))

/**
 * Beobachtet Charakterlevel, Ränge und Errungenschaften.
 * Rang-Aufstieg oder neue Errungenschaft → Feier-Overlay; sonst bei +Level ein kleiner Hinweis.
 */
export function ProgressCelebration() {
  const today = useToday()
  const sheet = useCharacter(today)
  const settings = useSettings()
  const navigate = useNavigate()
  const [big, setBig] = useState<ProgressEvent[]>([])
  const [toast, setToast] = useState<{ from: number; to: number } | null>(null)

  useEffect(() => {
    if (!sheet || !settings) return
    // Kurz warten, damit schnelle Eingaben (z. B. mehrfach +15 min) nur ein Ereignis auslösen
    const timer = window.setTimeout(() => {
      const next = snapshot(
        sheet.level,
        Object.fromEntries(sheet.skills.map((s) => [s.key, s.level])),
      )
      const unlocked = evaluateAchievements(sheet.stats)
        .filter((a) => a.unlocked)
        .map((a) => a.achievement.id)
      const dates = settings.achievementDates ?? {}
      const prev = settings.levelSnapshot ?? null
      const events = detectProgress(prev, next, unlocked, Object.keys(dates))

      const newIds = unlocked.filter((id) => !dates[id])
      if (!prev || !sameSnapshot(prev, next) || newIds.length > 0) {
        const nextDates = { ...dates }
        for (const id of newIds) nextDates[id] = today
        void settingsRepo.updateSettings({ levelSnapshot: next, achievementDates: nextDates })
      }
      const bigOnes = events.filter(isBigEvent)
      if (bigOnes.length) setBig((b) => [...b, ...bigOnes])
      else {
        const lvl = events.find((e) => e.kind === 'level-up')
        if (lvl && lvl.kind === 'level-up') setToast({ from: lvl.from, to: lvl.to })
      }
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [sheet, settings, today])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <>
      {toast && (
        <div className="pb-safe pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 md:bottom-6">
          <div className="animate-pop flex items-center gap-2 rounded-full border border-emerald-500/40 bg-zinc-900/95 px-4 py-2 text-sm shadow-xl">
            <ArrowUp className="size-4 text-emerald-400" />
            Charakterlevel <span className="tabular-nums text-zinc-400">{toast.from}</span> →{' '}
            <span className="font-bold tabular-nums text-emerald-300">{toast.to}</span>
          </div>
        </div>
      )}
      {big.length > 0 && (
        <CelebrationOverlay
          events={big}
          path={settings?.avatarPath ?? 'demon'}
          onClose={() => setBig([])}
          onShow={() => {
            setBig([])
            navigate('/charakter')
          }}
        />
      )}
    </>
  )
}

function CelebrationOverlay({
  events,
  path,
  onClose,
  onShow,
}: {
  events: ProgressEvent[]
  path: AvatarPath
  onClose: () => void
  onShow: () => void
}) {
  const confetti = CONFETTI
  const ranks = events.filter((e) => e.kind === 'rank-up')
  const achievements = events.filter((e) => e.kind === 'achievement')
  const items = events.flatMap((e) => (e.kind === 'item' ? [e.unlock] : []))
  const onlyItems = items.length > 0 && !ranks.length && !achievements.length
  const title = ranks.length
    ? 'Aufgestiegen!'
    : achievements.length > 1
      ? 'Neue Errungenschaften!'
      : achievements.length
        ? 'Neue Errungenschaft!'
        : 'Verwandlung!'
  const topStep = Math.max(0, ...items.map((u) => u.step))

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {confetti.map((c, i) => (
          <span
            key={i}
            className={cx('confetti absolute top-[-5%] block', onlyItems ? 'size-1 rounded-full' : 'h-3 w-1.5 rounded-sm')}
            style={{
              left: `${c.left}%`,
              backgroundColor: onlyItems ? '#f4f4f5' : c.color,
              opacity: onlyItems ? 0.6 : undefined,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration * (onlyItems ? 1.8 : 1)}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>
      <div
        className={cx(
          'animate-pop relative max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-3xl border p-6 text-center shadow-2xl',
          onlyItems ? 'border-zinc-500/50 bg-black' : 'border-amber-400/40 bg-zinc-900',
        )}
      >
        {items.length > 0 ? (
          <div className="mx-auto w-40 overflow-hidden rounded-2xl border border-zinc-700 bg-black">
            <Avatar c={avatarState(topStep * 10).counts} path={path} className="block h-auto w-full" />
          </div>
        ) : (
          <div className="glow mx-auto grid size-20 place-items-center rounded-full bg-amber-400/15 text-amber-300 ring-2 ring-amber-400/50">
            {ranks.length ? <Medal className="size-10" /> : <Trophy className="size-10" />}
          </div>
        )}
        <h2 className={cx('mt-4 text-2xl font-bold', onlyItems && 'font-mono tracking-widest uppercase')}>{title}</h2>
        <ul className="mt-4 space-y-2 text-left">
          {ranks.map((e, i) =>
            e.kind === 'rank-up' ? (
              <li key={`r${i}`} className={cx('rounded-xl px-3 py-2 ring-1', e.rank.tone)}>
                <div className="text-xs opacity-80">{e.skill ? SKILL_NAMES[e.skill as SkillKey] : 'Charakter'}</div>
                <div className="font-semibold">
                  Rang „{e.rank.name}“ <span className="text-xs font-normal opacity-80">(Level {Math.floor(e.level)})</span>
                </div>
              </li>
            ) : null,
          )}
          {achievements.map((e) => {
            if (e.kind !== 'achievement') return null
            const a = ACHIEVEMENTS.find((x) => x.id === e.id)
            return a ? (
              <li key={e.id} className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/30">
                <Trophy className="size-4 shrink-0 text-amber-300" />
                <div>
                  <div className="text-sm font-semibold text-amber-100">{a.title}</div>
                  <div className="text-xs text-zinc-400">{a.description}</div>
                </div>
              </li>
            ) : null
          })}
          {items.map((u) => (
            <li key={`i${u.step}`} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 font-mono ring-1 ring-white/20">
              <Sparkles className="size-4 shrink-0 text-zinc-100" />
              <div>
                <div className="text-sm font-semibold text-zinc-100">{unlockLabel(u, path)}</div>
                <div className="text-xs text-zinc-400">
                  Level {u.step * 10} · Stufe {u.step}/99
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            Weiter
          </Button>
          <Button variant="primary" onClick={onShow} autoFocus>
            Zum Charakter
          </Button>
        </div>
      </div>
    </div>
  )
}
