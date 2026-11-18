import { useId } from 'react'
import type { EnemyLook } from '../../../domain/combat'

/*
 * Gegner im gleichen Linienstil wie der Avatar, aus Bausteinen zusammengesetzt:
 * Körperform, Kopf, Waffe, Umhang, Flügel und Aura. Alles eigene, generische Fantasy-Figuren.
 */

const W = '#f4f4f5'
const B = '#000'

export function EnemyFigure({ look, boss = false, className, animate = true }: { look: EnemyLook; boss?: boolean; className?: string; animate?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const glow = `eg-${uid}`
  const tone = `et-${uid}`
  const a = (cls: string) => (animate ? cls : undefined)
  const big = look.body === 'giant' || look.body === 'golem'
  // Kopfposition und Körpermaße je nach Körperform
  const hx = 60
  const hy = look.body === 'beast' ? 70 : big ? 34 : 44
  const sY = big ? 52 : 60

  return (
    <svg viewBox="0 0 120 140" className={className} role="img" aria-label="Gegner">
      <defs>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={tone} width={3} height={3} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1={0.5} y1={0} x2={0.5} y2={3} stroke={W} strokeWidth={0.55} strokeOpacity={0.6} />
        </pattern>
      </defs>
      <rect width="120" height="140" fill={B} />
      <g stroke={W} fill={B} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
        <line x1={0} y1={130} x2={120} y2={130} strokeOpacity={0.6} />
        <rect x={0} y={130} width={120} height={10} fill={`url(#${tone})`} stroke="none" opacity={0.4} />

        {(look.aura || boss) && (
          <ellipse cx={60} cy={80} rx={boss ? 50 : 40} ry={boss ? 60 : 50} fill={W} fillOpacity={0.05} strokeOpacity={0.35} strokeDasharray="2 4" filter={`url(#${glow})`} className={a('av-pulse')} />
        )}

        <g className={a('av-breathe')}>
          {/* Flügel */}
          {look.wings &&
            [undefined, 'translate(120 0) scale(-1 1)'].map((tr, i) => (
              <g key={i} transform={tr}>
                <g className={a('av-flap')} style={{ transformOrigin: `52px ${sY + 6}px` }}>
                  <path d={`M52 ${sY + 6} L24 ${sY - 26} L8 ${sY + 6} Q14 ${sY + 4} 16 ${sY + 10} L18 ${sY + 30} Q24 ${sY + 24} 28 ${sY + 32} L34 ${sY + 40} Q42 ${sY + 30} 50 ${sY + 28} Z`} />
                  <path d={`M52 ${sY + 6} L24 ${sY - 26} L8 ${sY + 6} Q14 ${sY + 4} 16 ${sY + 10} L18 ${sY + 30} Q24 ${sY + 24} 28 ${sY + 32} L34 ${sY + 40} Q42 ${sY + 30} 50 ${sY + 28} Z`} fill={`url(#${tone})`} stroke="none" />
                  <path d={`M24 ${sY - 26} L16 ${sY + 10} M24 ${sY - 26} L28 ${sY + 32} M24 ${sY - 26} L42 ${sY + 30}`} fill="none" strokeWidth={0.9} />
                </g>
              </g>
            ))}
          {/* Umhang */}
          {look.cape && (
            <g className={a('av-flutter')} style={{ transformOrigin: `60px ${sY}px` }}>
              <path d={`M47 ${sY} L38 126 L50 120 L60 128 L70 120 L82 126 L73 ${sY} Z`} />
              <path d={`M47 ${sY} L38 126 L50 120 L60 128 L70 120 L82 126 L73 ${sY} Z`} fill={`url(#${tone})`} stroke="none" opacity={0.8} />
            </g>
          )}

          <Body look={look} sY={sY} tone={tone} />
          <Weapon look={look} sY={sY} glow={glow} anim={a} />
          <Head look={look} hx={hx} hy={hy} glow={glow} tone={tone} anim={a} />
        </g>
      </g>
    </svg>
  )
}

function Body({ look, sY, tone }: { look: EnemyLook; sY: number; tone: string }) {
  const hatch = `url(#${tone})`
  switch (look.body) {
    case 'beast':
      return (
        <g>
          <path d="M34 82 Q40 70 60 72 Q84 70 92 84 Q94 96 86 100 L36 100 Q28 94 34 82 Z" strokeWidth={1.4} />
          <path d="M60 72 Q84 70 92 84 Q94 96 86 100 L64 100 Z" fill={hatch} stroke="none" />
          {[40, 50, 76, 86].map((x, i) => (
            <path key={x} d={`M${x} 98 L${x + (i % 2 ? 2 : -2)} 128 L${x + (i % 2 ? 6 : 2)} 130`} fill="none" strokeWidth={2.4} />
          ))}
          <path d="M92 84 Q106 78 110 66 Q104 84 94 92" />
          <path d="M44 80 l4 -6 l3 6 l4 -7 l3 7 l4 -6" fill="none" strokeWidth={0.8} />
        </g>
      )
    case 'golem':
      return (
        <g>
          <path d="M34 54 L86 54 L92 96 L28 96 Z" strokeWidth={1.5} />
          <path d="M60 54 L86 54 L92 96 L64 96 Z" fill={hatch} stroke="none" />
          <path d="M40 66 L52 70 L48 82 M74 62 L70 76 L82 80" fill="none" strokeWidth={0.8} />
          <rect x={18} y={56} width={14} height={40} rx={3} />
          <rect x={88} y={56} width={14} height={40} rx={3} />
          <rect x={16} y={96} width={18} height={14} rx={3} />
          <rect x={86} y={96} width={18} height={14} rx={3} />
          <rect x={38} y={96} width={18} height={34} rx={2} />
          <rect x={64} y={96} width={18} height={34} rx={2} />
        </g>
      )
    case 'wisp':
      return (
        <g>
          {[
            [60, 76, 14],
            [40, 92, 9],
            [80, 94, 10],
            [52, 110, 7],
            [72, 112, 8],
          ].map(([x, y, r], i) => (
            <g key={i}>
              <path d={`M${x} ${y + r} Q${x - r} ${y} ${x} ${y - r * 1.9} Q${x + r} ${y} ${x} ${y + r} Z`} fill={W} fillOpacity={0.08} />
              <circle cx={x} cy={y + 1} r={r * 0.35} fill={W} stroke="none" />
            </g>
          ))}
        </g>
      )
    default: {
      // humanoid und giant
      const wide = look.body === 'giant'
      const sl = wide ? 34 : 44
      const sr = wide ? 86 : 76
      const hipL = wide ? 42 : 48
      const hipR = wide ? 78 : 72
      return (
        <g>
          <path d={`M${sl} ${sY} L${sr} ${sY} L${hipR} 96 L${hipL} 96 Z`} strokeWidth={1.5} />
          <path d={`M60 ${sY} L${sr} ${sY} L${hipR} 96 L62 96 Z`} fill={hatch} stroke="none" />
          <path d={`M${hipL} 96 L${hipL - 3} 128 L${hipL + 8} 128 L58 98 Z M${hipR} 96 L${hipR + 3} 128 L${hipR - 8} 128 L62 98 Z`} />
          <path d={`M${sl} ${sY + 1} L${sl - 8} 92 L${sl - 2} 94 L${sl + 6} ${sY + 10} Z M${sr} ${sY + 1} L${sr + 8} 92 L${sr + 2} 94 L${sr - 6} ${sY + 10} Z`} />
          <path d={`M${sl + 4} ${sY + 4} L60 ${sY + 12} L${sr - 4} ${sY + 4}`} fill="none" strokeWidth={0.8} />
          {wide && <path d={`M${sl - 2} ${sY - 4} Q${sl - 6} ${sY + 8} ${sl + 6} ${sY + 8} M${sr + 2} ${sY - 4} Q${sr + 6} ${sY + 8} ${sr - 6} ${sY + 8}`} strokeWidth={1.4} />}
        </g>
      )
    }
  }
}

function Weapon({ look, sY, glow, anim }: { look: EnemyLook; sY: number; glow: string; anim: (c: string) => string | undefined }) {
  if (look.body === 'beast' || look.body === 'wisp' || look.body === 'golem') return null
  const rx = look.body === 'giant' ? 96 : 86
  const lx = look.body === 'giant' ? 24 : 34
  switch (look.weapon) {
    case 'sword':
      return (
        <g>
          <path d={`M${rx} 92 L${rx + 2} 50 L${rx + 4} 92 Z`} />
          <rect x={rx - 4} y={91} width={10} height={2.5} />
          <rect x={rx + 0.8} y={93} width={2.4} height={7} />
        </g>
      )
    case 'greatsword':
      return (
        <g>
          <path d={`M${rx - 1} 96 L${rx - 1} 28 L${rx + 3} 20 L${rx + 7} 28 L${rx + 7} 96 Z`} strokeWidth={1.4} />
          <line x1={rx + 3} y1={30} x2={rx + 3} y2={92} strokeWidth={0.7} />
          <rect x={rx - 6} y={95} width={18} height={3} />
          <rect x={rx + 1.6} y={98} width={2.8} height={12} />
        </g>
      )
    case 'staff':
      return (
        <g>
          <line x1={rx + 2} y1={128} x2={rx + 2} y2={sY - 18} strokeWidth={2} />
          <circle cx={rx + 2} cy={sY - 23} r={5} fill={W} filter={`url(#${glow})`} className={anim('av-pulse')} />
          <path d={`M${rx - 4} ${sY - 16} Q${rx + 2} ${sY - 30} ${rx + 8} ${sY - 16}`} fill="none" />
        </g>
      )
    case 'claws':
      return (
        <path d={`M${lx - 2} 94 l-3 8 M${lx + 2} 95 l-1 9 M${lx + 6} 94 l1 8 M${rx - 6} 94 l-1 8 M${rx - 2} 95 l1 9 M${rx + 2} 94 l3 8`} fill="none" strokeWidth={1.4} />
      )
    case 'chains':
      return (
        <g fill="none" strokeWidth={0.9}>
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse key={`l${i}`} cx={lx - 2 - i * 2.4} cy={98 + i * 3.6} rx={2.4} ry={1.3} transform={`rotate(${i % 2 ? 60 : -30} ${lx - 2 - i * 2.4} ${98 + i * 3.6})`} />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <ellipse key={`r${i}`} cx={rx + 2 + i * 2.4} cy={98 + i * 3.6} rx={2.4} ry={1.3} transform={`rotate(${i % 2 ? -60 : 30} ${rx + 2 + i * 2.4} ${98 + i * 3.6})`} />
          ))}
        </g>
      )
    case 'scythe':
      return (
        <g>
          <line x1={rx + 4} y1={128} x2={rx - 2} y2={18} strokeWidth={2} />
          <path d={`M${rx - 2} 18 Q${rx - 30} 16 ${rx - 40} 36 Q${rx - 24} 26 ${rx - 2} 26 Z`} strokeWidth={1.3} />
        </g>
      )
    case 'dual':
      return (
        <g>
          <path d={`M${lx - 2} 94 L${lx - 14} 70 L${lx - 10} 69 L${lx + 1} 93 Z M${rx + 2} 94 L${rx + 14} 70 L${rx + 10} 69 L${rx - 1} 93 Z`} />
        </g>
      )
    default:
      return null
  }
}

function Head({
  look,
  hx,
  hy,
  glow,
  tone,
  anim,
}: {
  look: EnemyLook
  hx: number
  hy: number
  glow: string
  tone: string
  anim: (c: string) => string | undefined
}) {
  const eyes = (dy = 0, slit = false) => (
    <path
      d={slit ? `M${hx - 6} ${hy + dy} l4 1.5 M${hx + 6} ${hy + dy} l-4 1.5` : `M${hx - 5} ${hy + dy} l3 0 M${hx + 2} ${hy + dy} l3 0`}
      strokeWidth={1.8}
      filter={`url(#${glow})`}
      className={anim('av-blink')}
    />
  )
  if (look.body === 'beast') {
    // Wolfskopf nach rechts
    const x = 36
    const y = 78
    return (
      <g>
        <path d={`M${x + 8} ${y - 8} Q${x - 4} ${y - 10} ${x - 14} ${y + 2} L${x - 4} ${y + 6} L${x + 10} ${y + 6} Z`} strokeWidth={1.4} />
        <path d={`M${x + 4} ${y - 9} L${x + 2} ${y - 20} L${x + 9} ${y - 9} M${x - 2} ${y - 8} L${x - 6} ${y - 18} L${x + 1} ${y - 8}`} />
        <path d={`M${x - 12} ${y + 3} l2 3 l2 -3 l2 3 l2 -3`} fill="none" strokeWidth={0.8} />
        <path d={`M${x - 2} ${y - 3} l4 1`} strokeWidth={1.8} filter={`url(#${glow})`} className={anim('av-blink')} />
      </g>
    )
  }
  if (look.body === 'wisp') return null
  if (look.body === 'golem') {
    return (
      <g>
        <rect x={hx - 11} y={hy + 4} width={22} height={16} rx={2} strokeWidth={1.4} />
        {look.head === 'mask' ? <path d={`M${hx - 7} ${hy + 10} L${hx + 7} ${hy + 10}`} strokeWidth={1.8} filter={`url(#${glow})`} /> : eyes(12)}
      </g>
    )
  }
  const head = <path d={`M${hx - 8} ${hy} C${hx - 8} ${hy - 11} ${hx + 8} ${hy - 11} ${hx + 8} ${hy} L${hx + 6} ${hy + 7} Q${hx} ${hy + 12} ${hx - 6} ${hy + 7} Z`} strokeWidth={1.4} />
  switch (look.head) {
    case 'skull':
      return (
        <g>
          {head}
          <circle cx={hx - 3.5} cy={hy} r={2.4} fill={W} fillOpacity={0.15} />
          <circle cx={hx + 3.5} cy={hy} r={2.4} fill={W} fillOpacity={0.15} />
          <path d={`M${hx} ${hy + 3} l-1 2 l2 0 Z M${hx - 4} ${hy + 8} L${hx + 4} ${hy + 8} M${hx - 2} ${hy + 7} l0 2 M${hx} ${hy + 7} l0 2 M${hx + 2} ${hy + 7} l0 2`} strokeWidth={0.7} />
          <circle cx={hx - 3.5} cy={hy} r={0.8} fill={W} stroke="none" filter={`url(#${glow})`} className={anim('av-blink')} />
          <circle cx={hx + 3.5} cy={hy} r={0.8} fill={W} stroke="none" filter={`url(#${glow})`} className={anim('av-blink')} />
        </g>
      )
    case 'horns':
      return (
        <g>
          {head}
          <path d={`M${hx - 6} ${hy - 7} Q${hx - 16} ${hy - 8} ${hx - 17} ${hy - 22} Q${hx - 12} ${hy - 13} ${hx - 3} ${hy - 10} Z M${hx + 6} ${hy - 7} Q${hx + 16} ${hy - 8} ${hx + 17} ${hy - 22} Q${hx + 12} ${hy - 13} ${hx + 3} ${hy - 10} Z`} />
          {eyes(1, true)}
          <path d={`M${hx - 3} ${hy + 7} l1.5 2 l1.5 -2 l1.5 2 l1.5 -2`} fill="none" strokeWidth={0.7} />
        </g>
      )
    case 'hood':
      return (
        <g>
          <path d={`M${hx - 11} ${hy + 12} Q${hx - 13} ${hy - 12} ${hx} ${hy - 18} Q${hx + 13} ${hy - 12} ${hx + 11} ${hy + 12} Z`} strokeWidth={1.4} />
          <path d={`M${hx - 7} ${hy + 10} Q${hx - 8} ${hy - 6} ${hx} ${hy - 9} Q${hx + 8} ${hy - 6} ${hx + 7} ${hy + 10} Z`} fill={`url(#${tone})`} />
          {eyes(2)}
        </g>
      )
    case 'helmet':
      return (
        <g>
          <path d={`M${hx - 9} ${hy + 10} L${hx - 9} ${hy - 4} Q${hx} ${hy - 14} ${hx + 9} ${hy - 4} L${hx + 9} ${hy + 10} Z`} strokeWidth={1.5} />
          <path d={`M${hx - 7} ${hy + 1} L${hx + 7} ${hy + 1}`} strokeWidth={1.8} filter={`url(#${glow})`} className={anim('av-pulse')} />
          <path d={`M${hx} ${hy + 3} L${hx} ${hy + 9} M${hx - 3} ${hy + 6} l0 3 M${hx + 3} ${hy + 6} l0 3`} strokeWidth={0.7} />
          <path d={`M${hx} ${hy - 9} Q${hx + 6} ${hy - 22} ${hx + 14} ${hy - 18}`} fill="none" strokeWidth={1.6} />
        </g>
      )
    case 'crown':
      return (
        <g>
          {head}
          <path d={`M${hx - 9} ${hy - 6} L${hx - 9} ${hy - 15} L${hx - 5} ${hy - 10} L${hx - 2} ${hy - 18} L${hx} ${hy - 11} L${hx + 2} ${hy - 18} L${hx + 5} ${hy - 10} L${hx + 9} ${hy - 15} L${hx + 9} ${hy - 6} Z`} filter={`url(#${glow})`} />
          {eyes(1)}
        </g>
      )
    case 'mask':
      return (
        <g>
          {head}
          <path d={`M${hx - 8} ${hy - 3} L${hx + 8} ${hy - 3} L${hx + 6} ${hy + 7} Q${hx} ${hy + 11} ${hx - 6} ${hy + 7} Z`} fill={`url(#${tone})`} />
          {eyes(1, true)}
          <path d={`M${hx - 8} ${hy - 8} L${hx + 8} ${hy - 10}`} strokeWidth={1.6} />
          <path d={`M${hx + 8} ${hy - 10} q8 2 10 8 M${hx + 8} ${hy - 9} q6 5 6 11`} fill="none" strokeWidth={0.9} className={anim('av-flutter')} style={{ transformOrigin: `${hx + 8}px ${hy - 10}px` }} />
        </g>
      )
    case 'beast':
      return (
        <g>
          {head}
          <path d={`M${hx - 8} ${hy - 2} L${hx - 18} ${hy - 8} L${hx - 9} ${hy + 3} Z M${hx + 8} ${hy - 2} L${hx + 18} ${hy - 8} L${hx + 9} ${hy + 3} Z`} />
          {eyes(1, true)}
          <path d={`M${hx - 3} ${hy + 7} l1.5 2 l1.5 -2 l1.5 2 l1.5 -2`} fill="none" strokeWidth={0.7} />
        </g>
      )
    default:
      // gesichtslos
      return (
        <g>
          {head}
          <path d={`M${hx - 4} ${hy + 1} Q${hx} ${hy - 1} ${hx + 4} ${hy + 1}`} fill="none" strokeWidth={0.8} strokeOpacity={0.6} />
          <circle cx={hx} cy={hy + 1} r={1.6} fill={W} stroke="none" filter={`url(#${glow})`} className={anim('av-pulse')} />
        </g>
      )
  }
}
