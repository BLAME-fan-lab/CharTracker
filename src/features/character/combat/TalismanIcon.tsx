import { useId } from 'react'
import { STAT_INFO, type Rarity, type Talisman } from '../../../domain/loot'
import { cx } from '../../../lib/cx'

/** Talisman als leuchtender Edelstein; der Rahmen zeigt die Seltenheit, die Farbe den Bonus */
export function TalismanIcon({ t, size = 'md' }: { t: Pick<Talisman, 'stat' | 'rarity' | 'relic'>; size?: 'sm' | 'md' }) {
  const uid = useId().replace(/:/g, '')
  const color = STAT_INFO[t.stat].color
  const frame: Record<Rarity, { stroke: number; dash?: string; double?: boolean }> = {
    common: { stroke: 1 },
    rare: { stroke: 1, double: true },
    epic: { stroke: 1.4, dash: '3 2', double: true },
    legendary: { stroke: 2, double: true },
  }
  const f = frame[t.rarity as Rarity] ?? frame.common
  const glowing = t.rarity === 'epic' || t.rarity === 'legendary'
  return (
    <svg viewBox="0 0 32 32" className={cx('shrink-0', size === 'sm' ? 'size-6' : 'size-9')} aria-hidden="true">
      <defs>
        <filter id={`tg-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="32" height="32" rx="6" fill="#000" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="5" fill="none" stroke="#f4f4f5" strokeWidth={f.stroke} strokeDasharray={f.dash} />
      {f.double && <rect x="4" y="4" width="24" height="24" rx="3.5" fill="none" stroke="#f4f4f5" strokeOpacity={0.5} strokeWidth={0.6} />}
      <path
        d="M16 6.5 L18.6 13.4 L25.5 16 L18.6 18.6 L16 25.5 L13.4 18.6 L6.5 16 L13.4 13.4 Z"
        fill={color}
        stroke={color}
        strokeWidth={0.8}
        strokeLinejoin="round"
        filter={`url(#tg-${uid})`}
        className={glowing ? 'av-pulse' : undefined}
      />
      <circle cx="16" cy="16" r="1.6" fill="#fff" />
      {t.relic != null && <path d="M10 5 L12 2.5 L14 4.5 L16 2 L18 4.5 L20 2.5 L22 5 Z" fill="#facc15" stroke="none" />}
    </svg>
  )
}
