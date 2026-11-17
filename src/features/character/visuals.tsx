import { Lock, Medal, Trophy } from 'lucide-react'
import { MAX_LEVEL } from '../../domain/character'
import type { AchievementState } from '../../domain/achievements'
import { SKILL_ORDER, type SkillKey, type SkillResult } from '../../domain/characterSheet'
import { nextRank, rankFor, RANKS } from '../../domain/ranks'
import { cx } from '../../lib/cx'
import { SKILL_HEX } from './skillMeta'
import { fmt, type DateStr } from '../../lib/dates'


const SHORT: Record<SkillKey, string> = {
  academic: 'Uni',
  sport: 'Sport',
  health: 'Gesundheit',
  hygiene: 'Hygiene',
  reading: 'Lesen',
  music: 'Musik',
  project: 'Projekt',
}

/** Rang-Plakette, z. B. „Geselle“ in Bronze */
export function RankBadge({ level, size = 'sm' }: { level: number; size?: 'sm' | 'md' }) {
  const rank = rankFor(level)
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1 rounded-full font-semibold whitespace-nowrap ring-1',
        size === 'sm' ? 'px-1.5 py-px text-[11px]' : 'px-2.5 py-0.5 text-xs',
        rank.tone,
      )}
    >
      <Medal className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      {rank.name}
    </span>
  )
}

/** „noch 88 bis Fortgeschrittener“ */
export function NextRankText({ level, className }: { level: number; className?: string }) {
  const next = nextRank(level)
  if (!next) return <span className={className}>Höchster Rang erreicht</span>
  return (
    <span className={className}>
      noch {next.missing} bis {next.rank.name}
    </span>
  )
}

/**
 * Skill-Netz: Siebeneck mit allen Bäumen. Ringe bei 250/500/750/1000.
 * Die Fläche hat die Farbe deines Charakter-Rangs.
 */
export function SkillRadar({ skills, characterLevel }: { skills: SkillResult[]; characterLevel: number }) {
  const cx0 = 160
  const cy0 = 150
  const R = 108
  const n = SKILL_ORDER.length
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const point = (i: number, r: number) => [cx0 + r * Math.cos(angle(i)), cy0 + r * Math.sin(angle(i))] as const
  const ring = (f: number) => SKILL_ORDER.map((_, i) => point(i, R * f).join(',')).join(' ')
  const levelOf = (k: SkillKey) => skills.find((s) => s.key === k)?.level ?? 0
  const poly = SKILL_ORDER.map((k, i) => point(i, Math.max(2, (R * levelOf(k)) / MAX_LEVEL)).join(',')).join(' ')
  const color = rankFor(characterLevel).color

  return (
    <svg viewBox="-30 0 380 300" className="h-auto w-full max-w-sm" role="img" aria-label="Skill-Netz deiner sieben Bäume">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="#3f3f46" strokeWidth={f === 1 ? 1.2 : 0.7} />
      ))}
      {SKILL_ORDER.map((_, i) => {
        const [x, y] = point(i, R)
        return <line key={i} x1={cx0} y1={cy0} x2={x} y2={y} stroke="#3f3f46" strokeWidth={0.7} />
      })}
      <polygon points={poly} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {SKILL_ORDER.map((k, i) => {
        const [x, y] = point(i, Math.max(2, (R * levelOf(k)) / MAX_LEVEL))
        return <circle key={k} cx={x} cy={y} r={4} fill={SKILL_HEX[k]} stroke="#09090b" strokeWidth={1.5} />
      })}
      {SKILL_ORDER.map((k, i) => {
        const [x, y] = point(i, R + 22)
        const anchor = Math.abs(x - cx0) < 8 ? 'middle' : x > cx0 ? 'start' : 'end'
        return (
          <g key={k}>
            <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fill="#a1a1aa">
              {SHORT[k]}
            </text>
            <text x={x} y={y + 13} textAnchor={anchor} dominantBaseline="middle" fontSize={11} fontWeight={700} fill={SKILL_HEX[k]}>
              {Math.floor(levelOf(k))}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Rang-Pfad: 10 Stufen à 100 Level, aktuelle Stufe hervorgehoben */
export function RankTrack({ level, color }: { level: number; color: string }) {
  const current = rankFor(level)
  return (
    <div className="space-y-2">
      <div className="flex gap-0.5" aria-hidden="true">
        {RANKS.map((r) => {
          const fill = Math.max(0, Math.min(1, (level - r.min) / 100))
          return (
            <div
              key={r.index}
              className={cx('h-2.5 flex-1 overflow-hidden rounded-sm bg-zinc-800', r.index === current.index && 'ring-1 ring-zinc-400')}
              title={`${r.name} (${r.min}–${r.min + 99})`}
            >
              <div className="h-full" style={{ width: `${fill * 100}%`, backgroundColor: color }} />
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <RankBadge level={level} />
          <span className="tabular-nums">
            Stufe {current.index + 1} von 10 ({current.min}–{current.min + 99})
          </span>
        </span>
        <NextRankText level={level} />
      </div>
    </div>
  )
}

const num = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 1 })

/** Errungenschaften als Karten (freigeschaltet mit Datum, gesperrt mit Fortschritt) */
export function AchievementGrid({ items, dates }: { items: AchievementState[]; dates: Record<string, DateStr> }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map(({ achievement: a, current, target, unlocked }) => (
        <li
          key={a.id}
          className={cx(
            'flex items-start gap-3 rounded-xl border p-3',
            unlocked ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-800 bg-zinc-900/40',
          )}
        >
          <span
            className={cx(
              'grid size-9 shrink-0 place-items-center rounded-full',
              unlocked ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800 text-zinc-500',
            )}
          >
            {unlocked ? <Trophy className="size-4" /> : <Lock className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className={cx('text-sm font-semibold', unlocked ? 'text-amber-100' : 'text-zinc-300')}>{a.title}</div>
            <div className="text-xs text-zinc-400">{a.description}</div>
            {unlocked ? (
              dates[a.id] && <div className="mt-1 text-[11px] text-amber-300/80">erreicht am {fmt(dates[a.id], 'd. MMMM yyyy')}</div>
            ) : (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-zinc-500" style={{ width: `${(current / target) * 100}%` }} />
                </div>
                <span className="text-[11px] tabular-nums text-zinc-500">
                  {num(current)}/{num(target)}
                </span>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
