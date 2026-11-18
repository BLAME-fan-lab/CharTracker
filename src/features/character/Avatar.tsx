import { useId } from 'react'
import type { AvatarCounts, AvatarPath } from '../../domain/avatar'

/*
 * Avatar im Mittelalter-Fantasy-Stil: ein eigener Ritter-Magier mit Schwert und schwebendem Grimoire,
 * umgeben von Wald, Burg, Waldgeistern und Dämonen. Nur weiße Linien auf Schwarz,
 * Schatten als Strichschraffur. Gezeichnet wird anhand der Zähler aus domain/avatar.
 */

const W = '#f4f4f5'
const B = '#000'
const GROUND = 250

type P = readonly [number, number]
type Anim = (cls: string) => string | undefined
interface Ids {
  glow: string
  tone: string
  mail: string
  clip: string
}

/** feste Pseudo-Zufallswerte (stabil zwischen Renderings) */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}
const f1 = (n: number) => Math.round(n * 10) / 10

const normal = (a: P, b: P): P => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy) || 1
  return [-dy / l, dx / l]
}
/** Gerades, sich verjüngendes Stück von a nach b */
const limb = (a: P, b: P, w1: number, w2: number) => {
  const [nx, ny] = normal(a, b)
  return `M${f1(a[0] + nx * w1)} ${f1(a[1] + ny * w1)} L${f1(b[0] + nx * w2)} ${f1(b[1] + ny * w2)} L${f1(b[0] - nx * w2)} ${f1(b[1] - ny * w2)} L${f1(a[0] - nx * w1)} ${f1(a[1] - ny * w1)} Z`
}
/** Gebeugtes Glied (Schulter → Ellbogen → Hand, Hüfte → Knie → Knöchel) als eine Kontur */
const bent = (a: P, b: P, c: P, w1: number, w2: number, w3: number) => {
  const n1 = normal(a, b)
  const n2 = normal(b, c)
  let mx = n1[0] + n2[0]
  let my = n1[1] + n2[1]
  const ml = Math.hypot(mx, my) || 1
  mx /= ml
  my /= ml
  const pts: P[] = [
    [a[0] + n1[0] * w1, a[1] + n1[1] * w1],
    [b[0] + mx * w2, b[1] + my * w2],
    [c[0] + n2[0] * w3, c[1] + n2[1] * w3],
    [c[0] - n2[0] * w3, c[1] - n2[1] * w3],
    [b[0] - mx * w2, b[1] - my * w2],
    [a[0] - n1[0] * w1, a[1] - n1[1] * w1],
  ]
  return 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L') + ' Z'
}
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
/** Querlinie über ein Glied (Bandagen, Platten) */
const across = (a: P, b: P, t: number, w: number) => {
  const [x, y] = lerp(a, b, t)
  const [nx, ny] = normal(a, b)
  return `M${f1(x + nx * w)} ${f1(y + ny * w)} L${f1(x - nx * w)} ${f1(y - ny * w)}`
}
const angle = (a: P, b: P) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
/** Vierzackiger Stern – das Siegel des Grimoires */
const star4 = (x: number, y: number, r: number) => {
  const k = r * 0.28
  return `M${f1(x)} ${f1(y - r)} L${f1(x + k)} ${f1(y - k)} L${f1(x + r)} ${f1(y)} L${f1(x + k)} ${f1(y + k)} L${f1(x)} ${f1(y + r)} L${f1(x - k)} ${f1(y + k)} L${f1(x - r)} ${f1(y)} L${f1(x - k)} ${f1(y - k)} Z`
}
const MIRROR = 'translate(240 0) scale(-1 1)'

export function Avatar({
  c,
  path = 'demon',
  boosts = [],
  className,
  animate = true,
}: {
  c: AvatarCounts
  path?: AvatarPath
  /** Leuchtfarben ausgerüsteter Talismane – die einzige Farbe im Bild */
  boosts?: string[]
  className?: string
  animate?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const boostId = `boost-${uid}`
  const auraId = `aura-${uid}`
  const ids: Ids = { glow: `glow-${uid}`, tone: `tone-${uid}`, mail: `mail-${uid}`, clip: `clip-${uid}` }
  const a: Anim = (cls) => (animate ? cls : undefined)
  const hatch = `url(#${ids.tone})`

  return (
    <svg viewBox="0 0 240 280" className={className} role="img" aria-label="Dein Avatar">
      <defs>
        <filter id={ids.glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={ids.tone} width={3} height={3} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1={0.5} y1={0} x2={0.5} y2={3} stroke={W} strokeWidth={0.55} strokeOpacity={0.6} />
        </pattern>
        {boosts.length > 0 && (
          <>
            <filter id={boostId} x="-30%" y="-30%" width="160%" height="160%">
              {boosts.map((col, i) => (
                <feDropShadow key={i} dx={0} dy={0} stdDeviation={1.6 + i * 0.8} floodColor={col} floodOpacity={0.95} />
              ))}
            </filter>
            <radialGradient id={auraId}>
              <stop offset="0%" stopColor={boosts[0]} stopOpacity={0.35} />
              <stop offset="60%" stopColor={boosts[boosts.length - 1]} stopOpacity={0.12} />
              <stop offset="100%" stopColor={boosts[boosts.length - 1]} stopOpacity={0} />
            </radialGradient>
          </>
        )}
        <pattern id={ids.mail} width={2.6} height={2.2} patternUnits="userSpaceOnUse">
          <path d="M0 1.1 A1.3 1 0 0 1 2.6 1.1" fill="none" stroke={W} strokeWidth={0.45} strokeOpacity={0.8} />
        </pattern>
      </defs>
      <rect width="240" height="280" fill={B} />

      <g stroke={W} fill={B} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        <Sky c={c} hatch={hatch} anim={a} />
        <Landscape c={c} ids={ids} anim={a} />

        {/* Großer Magiekreis hinter der Figur */}
        {c.magic >= 7 && (
          <g opacity={0.35} fill="none" className={a('av-spin-mid')} style={{ transformOrigin: '120px 150px' }}>
            <circle cx={120} cy={150} r={74} />
            <circle cx={120} cy={150} r={66} strokeDasharray="2 4" />
            <path
              d={Array.from({ length: 8 }, (_, i) => {
                const p = (k: number) => {
                  const ang = (k / 8) * Math.PI * 2 - Math.PI / 2
                  return `${f1(120 + Math.cos(ang) * 66)} ${f1(150 + Math.sin(ang) * 66)}`
                }
                return `M${p(i)} L${p(i + 3)}`
              }).join(' ')}
              strokeWidth={0.8}
            />
          </g>
        )}
        {/* Strahlenkranz des Magierkönigs */}
        {c.apex >= 1 && (
          <g filter={`url(#${ids.glow})`} className={a('av-spin')} style={{ transformOrigin: '120px 150px' }}>
            {Array.from({ length: 24 }, (_, i) => {
              const ang = (i / 24) * Math.PI * 2
              const r2 = i % 2 ? 104 : 116
              return (
                <line
                  key={`ap${i}`}
                  x1={f1(120 + Math.cos(ang) * 84)}
                  y1={f1(150 + Math.sin(ang) * 84)}
                  x2={f1(120 + Math.cos(ang) * r2)}
                  y2={f1(150 + Math.sin(ang) * r2)}
                  strokeOpacity={0.6}
                />
              )
            })}
            <circle cx={120} cy={150} r={82} fill="none" strokeOpacity={0.7} />
          </g>
        )}

        {/* Farbiger Schimmer der Talismane */}
        {boosts.length > 0 && <ellipse cx={120} cy={168} rx={62} ry={96} fill={`url(#${auraId})`} stroke="none" className={a('av-pulse')} />}
        <g filter={boosts.length > 0 ? `url(#${boostId})` : undefined}>
          <g filter={c.magic >= 5 || c.apex >= 1 ? `url(#${ids.glow})` : undefined}>
            <Figure c={c} path={path} ids={ids} anim={a} />
          </g>
        </g>
        {/* Leuchtsteine der Talismane kreisen um den Helden */}
        {boosts.length > 0 && (
          <g className={a('av-orbit-slow')} style={{ transformOrigin: '120px 165px' }}>
            {boosts.map((col, i) => {
              const ang = (i / boosts.length) * Math.PI * 2 - Math.PI / 6
              const x = 120 + Math.cos(ang) * 58
              const y = 165 + Math.sin(ang) * 58
              return (
                <g key={`bs${i}`}>
                  <path d={star4(x, y, 3.6)} fill={col} stroke={col} strokeWidth={0.6} filter={`url(#${ids.glow})`} />
                  <circle cx={f1(x)} cy={f1(y)} r={1.1} fill={W} stroke="none" />
                </g>
              )
            })}
          </g>
        )}

        <Grimoire n={c.grimoire} ids={ids} anim={a} />
        <Companions c={c} ids={ids} anim={a} />

        {/* Schwebende Runen */}
        {c.magic >= 3 &&
          RUNES.map(([x, y, d], i) => (
            <g key={`ru${i}`} className={a('av-rune')} style={{ animationDelay: `${-i * 0.8}s` }}>
              <path d={`M${x} ${y} ${d}`} fill="none" strokeWidth={1.1} filter={`url(#${ids.glow})`} />
            </g>
          ))}
        {/* Bodennebel */}
        <g fill="none" stroke={W} strokeWidth={1.4} strokeOpacity={0.16}>
          <path d={`M-40 238 ${'q10 -3 20 0 q10 3 20 0 '.repeat(8)}`} className={a('av-mist')} />
          <path d={`M-40 245 ${'q10 -2.5 20 0 q10 2.5 20 0 '.repeat(8)}`} className={a('av-mist-rev')} />
        </g>
        {/* Schwebender Staub */}
        {Array.from({ length: 10 }, (_, i) => (
          <circle
            key={`mo${i}`}
            cx={f1(10 + rnd(i, 51) * 220)}
            cy={f1(150 + rnd(i, 52) * 95)}
            r={f1(0.5 + rnd(i, 53) * 0.6)}
            fill={W}
            stroke="none"
            className={a('av-mote')}
            style={{ opacity: 0, animationDuration: `${8 + rnd(i, 54) * 6}s`, animationDelay: `${-rnd(i, 55) * 12}s` }}
          />
        ))}
        {/* Magiesturm */}
        {c.magic >= 8 && (
          <g fill="none" strokeOpacity={0.6} className={a('av-spin-fast')} style={{ transformOrigin: '120px 160px' }}>
            <path d="M60 140 A64 90 0 0 1 120 70" />
            <path d="M180 180 A64 90 0 0 1 120 250" />
            <path d="M176 110 A58 84 0 0 1 184 170" strokeWidth={0.8} />
            <path d="M64 200 A58 84 0 0 1 56 140" strokeWidth={0.8} />
          </g>
        )}
        {/* Fallende Blätter */}
        {c.leaves >= 1 &&
          Array.from({ length: c.leaves >= 2 ? 30 : 12 }, (_, i) => (
            <g key={`lf${i}`} className={a('av-ash')} style={{ animationDuration: `${7 + rnd(i, 4) * 6}s`, animationDelay: `${-rnd(i, 5) * 12}s` }}>
              <path d={`M${f1(rnd(i, 1) * 240)} ${f1(rnd(i, 2) * 240)} q2 -3 5 0 q-2 3 -5 0 Z`} strokeWidth={0.7} className={a('av-leaf-spin')} />
            </g>
          ))}
        {/* Glühwürmchen */}
        {c.firefly >= 1 &&
          Array.from({ length: 12 }, (_, i) => (
            <circle
              key={`ff${i}`}
              cx={f1(10 + rnd(i, 21) * 220)}
              cy={f1(170 + rnd(i, 22) * 75)}
              r={1}
              fill={W}
              stroke="none"
              filter={`url(#${ids.glow})`}
              className={a('av-firefly')}
              style={{ animationDelay: `${-rnd(i, 23) * 6}s`, animationDuration: `${4 + rnd(i, 24) * 4}s` }}
            />
          ))}
      </g>
    </svg>
  )
}

/** Runen-Zeichen: Position und Strichfolge */
const RUNES: [number, number, string][] = [
  [80, 86, 'l0 9 m0 -9 l4 3 l-4 2 l4 4'],
  [168, 64, 'l0 9 m-3 -6 l6 3 m-6 0 l6 -3'],
  [182, 196, 'l3 -5 l3 5 m-3 -5 l0 9'],
  [76, 212, 'l4 0 l-4 5 l4 0 m-2 -8 l0 11'],
  [150, 40, 'l5 4 l-5 4 m5 -8 l0 9'],
  [96, 52, 'l0 9 m0 -5 l4 -3 m-4 5 l4 3'],
]

/* ---------- Himmel ---------- */

const STARS: P[] = [
  [24, 30],
  [64, 24],
  [106, 36],
  [140, 22],
  [226, 92],
]

function Sky({ c, hatch, anim }: { c: AvatarCounts; hatch: string; anim: Anim }) {
  return (
    <g>
      {c.star >= 5 &&
        Array.from({ length: 34 }, (_, i) => (
          <circle key={`ss${i}`} cx={f1(rnd(i, 31) * 240)} cy={f1(18 + rnd(i, 32) * 110)} r={f1(0.5 + rnd(i, 33) * 0.5)} fill={W} stroke="none" fillOpacity={0.7} />
        ))}
      {STARS.slice(0, Math.min(4, c.star)).map(([x, y], i) => (
        <path key={`st${i}`} d={star4(x, y, 3.5)} fill={W} stroke="none" className={anim('av-twinkle')} style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
      {c.moon >= 1 && (
        <g>
          <circle cx={196} cy={52} r={18} />
          {c.moon >= 2 ? (
            <g>
              <circle cx={196} cy={52} r={18} fill={hatch} stroke="none" />
              <path d="M196 34 A18 18 0 0 1 196 70 A14 18 0 0 0 196 34 Z" fill={W} stroke="none" fillOpacity={0.9} />
            </g>
          ) : (
            <g strokeOpacity={0.5}>
              <circle cx={190} cy={47} r={3.5} />
              <circle cx={201} cy={59} r={2.2} />
              <circle cx={203} cy={44} r={1.4} />
            </g>
          )}
        </g>
      )}
      {[
        [168, 76],
        [150, 62],
        [180, 96],
      ]
        .slice(0, c.raven)
        .map(([x, y], i) => (
          <g key={`rv${i}`} className={anim('av-glide')} style={{ animationDelay: `${-i * 2.3}s` }}>
            <path
              d={`M${x - 6} ${y - 1} q3 -3 6 1 q3 -4 6 -1`}
              fill="none"
              strokeWidth={1.2}
              className={anim('av-flap-fast')}
              style={{ animationDelay: `${-i * 0.17}s` }}
            />
          </g>
        ))}
    </g>
  )
}

/* ---------- Landschaft ---------- */

type TreeDef = { x: number; h: number; kind: 'pine' | 'oak' }
const TREES: TreeDef[] = [
  { x: 18, h: 110, kind: 'pine' },
  { x: 224, h: 116, kind: 'pine' },
  { x: 44, h: 74, kind: 'pine' },
  { x: 200, h: 82, kind: 'pine' },
  { x: 2, h: 92, kind: 'oak' },
  { x: 238, h: 94, kind: 'oak' },
  { x: 62, h: 46, kind: 'pine' },
  { x: 182, h: 50, kind: 'pine' },
]

function Tree({ t, hatch, anim, i }: { t: TreeDef; hatch: string; anim: Anim; i: number }) {
  return (
    <g className={anim('av-tree')} style={{ transformOrigin: `${t.x}px ${GROUND}px`, animationDelay: `${-i * 1.3}s`, animationDuration: `${5 + (i % 3)}s` }}>
      <TreeShape t={t} hatch={hatch} />
    </g>
  )
}

function TreeShape({ t, hatch }: { t: TreeDef; hatch: string }) {
  const top = GROUND - t.h
  if (t.kind === 'oak') {
    const r = t.h * 0.3
    const cy = top + r
    return (
      <g>
        <path d={`M${t.x - 3} ${GROUND} L${t.x - 2} ${f1(cy + r * 0.6)} L${t.x + 2} ${f1(cy + r * 0.6)} L${t.x + 3} ${GROUND} Z`} />
        {[
          [-0.7, 0.3, 0.6],
          [0.7, 0.35, 0.6],
          [0, -0.2, 0.75],
          [-0.35, 0.65, 0.5],
          [0.4, 0.7, 0.5],
        ].map(([dx, dy, s], i) => (
          <circle key={i} cx={f1(t.x + dx * r)} cy={f1(cy + dy * r)} r={f1(r * s)} />
        ))}
        <circle cx={f1(t.x + 0.5 * r)} cy={f1(cy + 0.4 * r)} r={f1(r * 0.55)} fill={hatch} stroke="none" />
      </g>
    )
  }
  const w = t.h * 0.34
  return (
    <g>
      <rect x={t.x - 2} y={GROUND - 10} width={4} height={10} />
      {[0, 1, 2, 3].map((i) => {
        const yb = GROUND - 8 - i * (t.h * 0.22)
        const yt = yb - t.h * 0.36
        const ww = w * (1 - i * 0.2)
        return (
          <g key={i}>
            <path d={`M${f1(t.x - ww)} ${f1(yb)} L${t.x} ${f1(yt)} L${f1(t.x + ww)} ${f1(yb)} Q${t.x} ${f1(yb - 4)} ${f1(t.x - ww)} ${f1(yb)} Z`} />
            <path d={`M${t.x} ${f1(yt)} L${f1(t.x + ww)} ${f1(yb)} Q${f1(t.x + ww * 0.4)} ${f1(yb - 3)} ${t.x} ${f1(yb - 2)} Z`} fill={hatch} stroke="none" />
          </g>
        )
      })}
    </g>
  )
}

function Chain({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const n = Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) / 5))
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = lerp([x1, y1], [x2, y2], (i + 0.5) / n)
        return <ellipse key={i} cx={f1(x)} cy={f1(y)} rx={2.6} ry={1.4} fill="none" strokeWidth={0.9} transform={`rotate(${f1(ang + (i % 2 ? 90 : 0))} ${f1(x)} ${f1(y)})`} />
      })}
    </g>
  )
}

const DEMON_SHAPE =
  'M186 250 L190 200 Q194 182 204 176 L203 166 Q199 154 205 146 L210 140 L214 150 L224 150 L228 140 L233 146 Q239 154 235 166 L234 176 Q244 182 248 200 L252 250 Z'

function Landscape({ c, ids, anim }: { c: AvatarCounts; ids: Ids; anim: Anim }) {
  const hatch = `url(#${ids.tone})`
  const glow = `url(#${ids.glow})`
  return (
    <g>
      {/* Uralter Waldgeist am Himmel */}
      {c.spirit >= 5 && (
        <g opacity={0.3} fill="none" filter={glow}>
          <path d="M150 112 Q148 92 160 80 Q168 72 176 74 Q186 72 192 80 Q202 92 198 112 Q186 124 174 126 Q160 124 150 112 Z" />
          <circle cx={164} cy={96} r={2} fill={W} stroke="none" />
          <circle cx={186} cy={96} r={2} fill={W} stroke="none" />
          <path d="M162 80 L150 56 L134 46 M150 56 L144 34 M156 66 L140 64 M188 80 L200 56 L216 46 M200 56 L206 34 M194 66 L210 64" strokeWidth={1.6} />
        </g>
      )}

      {/* Berge */}
      {c.mountain >= 1 && (
        <g>
          <path d="M0 160 L20 128 L44 108 L64 124 L92 104 L120 122 L150 100 L178 124 L204 112 L240 134 L240 170 L0 170 Z" strokeOpacity={0.55} />
          <path d="M44 108 L64 124 L54 170 L40 170 Z M150 100 L178 124 L164 170 L150 170 Z M92 104 L120 122 L108 170 L96 170 Z" fill={hatch} stroke="none" opacity={0.6} />
        </g>
      )}

      {/* Burg */}
      {c.castle >= 1 && (
        <g opacity={0.85}>
          <rect x={36} y={106} width={42} height={14} />
          {[36, 44, 60, 68].map((x) => (
            <rect key={x} x={x} y={103} width={4} height={3} />
          ))}
          <rect x={50} y={92} width={14} height={28} />
          <path d="M50 92 L57 82 L64 92" />
          <path d="M55 120 L55 112 Q57 109 59 112 L59 120" />
          {c.castle >= 2 && (
            <g>
              <rect x={32} y={96} width={8} height={24} />
              <path d="M31 96 L36 86 L41 96" />
              <rect x={74} y={94} width={8} height={26} />
              <path d="M73 94 L78 84 L83 94" />
            </g>
          )}
          {c.castle >= 3 &&
            [
              [36, 86],
              [57, 82],
              [78, 84],
            ].map(([x, y]) => (
              <g key={x}>
                <line x1={x} y1={y} x2={x} y2={y - 8} strokeWidth={0.9} />
                <path d={`M${x} ${y - 8} L${x + 6} ${y - 6} L${x} ${y - 4}`} strokeWidth={0.9} className={anim('av-flutter')} style={{ transformOrigin: `${x}px ${y - 6}px` }} />
              </g>
            ))}
          {c.castle >= 4 &&
            [
              [57, 98],
              [57, 105],
              [36, 102],
              [78, 100],
              [44, 112],
              [70, 112],
            ].map(([x, y], i) => (
              <rect key={`cw${i}`} x={x - 1} y={y} width={2} height={3} fill={W} stroke="none" filter={glow} className={anim('av-twinkle')} style={{ animationDelay: `${i * 0.4}s` }} />
            ))}
        </g>
      )}

      {/* Dämonentor hinter der Figur */}
      {c.demon >= 3 && (
        <g opacity={0.7}>
          <path d="M66 250 L66 150 Q66 86 120 82 Q174 86 174 150 L174 250 Z" strokeWidth={1.6} />
          <path d="M78 250 L78 152 Q78 96 120 93 Q162 96 162 152 L162 250 Z" fill={hatch} />
          {Array.from({ length: 9 }, (_, i) => {
            const ang = Math.PI + (i / 8) * Math.PI
            return (
              <line
                key={`ps${i}`}
                x1={f1(120 + Math.cos(ang) * 42)}
                y1={f1(150 + Math.sin(ang) * 57)}
                x2={f1(120 + Math.cos(ang) * 54)}
                y2={f1(150 + Math.sin(ang) * 67)}
                strokeWidth={0.9}
              />
            )
          })}
          {[170, 190, 210, 230].map((y) => (
            <path key={y} d={`M66 ${y} L78 ${y} M162 ${y} L174 ${y}`} strokeWidth={0.9} />
          ))}
          <g fill="none" strokeOpacity={0.8} className={anim('av-spin-mid')} style={{ transformOrigin: '120px 170px' }}>
            <path d="M90 170 a30 30 0 0 1 30 -30 a24 24 0 0 1 24 24 a18 18 0 0 1 -18 18 a12 12 0 0 1 -12 -12" />
          </g>
          {c.demon >= 5 && (
            <g filter={glow}>
              <path d={`${star4(72, 196, 6)} ${star4(168, 196, 6)}`} fill={W} stroke="none" className={anim('av-pulse')} />
              <circle cx={72} cy={196} r={9} fill="none" />
              <circle cx={168} cy={196} r={9} fill="none" />
            </g>
          )}
        </g>
      )}

      {/* Lauernder Dämon rechts im Wald */}
      {c.demon >= 2 && (
        <g className={anim('av-lurk')}>
          <path d={DEMON_SHAPE} strokeWidth={1.4} />
          <path d={DEMON_SHAPE} fill={hatch} stroke="none" />
          <path d="M207 146 Q198 136 200 124 Q204 136 212 140 M231 146 Q240 136 238 124 Q234 136 226 140" />
          <path d="M210 157 l5 2 M228 157 l-5 2" strokeWidth={1.6} filter={glow} className={anim('av-blink')} />
          <path d="M213 166 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3" fill="none" strokeWidth={0.8} />
          {c.demon >= 4 && (
            <g>
              <Chain x1={196} y1={196} x2={182} y2={250} />
              <Chain x1={238} y1={190} x2={240} y2={250} />
              <Chain x1={218} y1={178} x2={214} y2={250} />
            </g>
          )}
        </g>
      )}

      {/* Wald */}
      {TREES.slice(0, c.tree).map((t, i) => (
        <Tree key={`tr${i}`} t={t} hatch={hatch} anim={anim} i={i} />
      ))}

      {/* Augen im Dunkel */}
      {c.demon >= 1 &&
        [
          [30, 206],
          [214, 194],
          [54, 232],
        ].map(([x, y], i) => (
          <path
            key={`de${i}`}
            d={`M${x - 5} ${y} L${x - 1.5} ${y + 1.4} M${x + 1.5} ${y + 1.4} L${x + 5} ${y}`}
            strokeWidth={1.3}
            filter={glow}
            className={anim('av-blink')}
            style={{ animationDelay: `${i * 0.7}s` }}
          />
        ))}

      {/* Steinkreis */}
      {c.ruin >= 1 &&
        [
          [38, 26, 9],
          [52, 18, 8],
          [188, 22, 9],
          [202, 28, 10],
        ].map(([x, h, w]) => (
          <g key={`mh${x}`}>
            <path d={`M${x - w / 2} ${GROUND} L${x - w / 2 + 1} ${GROUND - h + 3} Q${x} ${GROUND - h - 2} ${x + w / 2 - 1} ${GROUND - h + 3} L${x + w / 2} ${GROUND} Z`} />
            <path d={`M${x} ${GROUND - h + 6} l0 6 m-2 -3 l4 0`} strokeWidth={0.7} strokeOpacity={0.7} />
          </g>
        ))}

      {/* Ordensbanner */}
      {c.banner >= 1 && (
        <g>
          <line x1={10} y1={GROUND} x2={10} y2={136} strokeWidth={1.6} />
          <circle cx={10} cy={134} r={1.8} fill={W} stroke="none" />
          <g className={anim('av-flutter-strong')} style={{ transformOrigin: '10px 140px' }}>
            <path d="M10 140 L36 140 L36 172 L23 166 L10 172 Z" />
            <path d={star4(23, 154, 6)} fill={W} stroke="none" />
          </g>
        </g>
      )}

      {/* Boden */}
      <rect x={0} y={GROUND} width={240} height={30} fill={hatch} stroke="none" opacity={0.4} />
      <line x1={0} y1={GROUND} x2={240} y2={GROUND} strokeWidth={1.5} />
      {Array.from({ length: 22 }, (_, i) => {
        const x = f1(6 + i * 11 + rnd(i, 41) * 4)
        return (
          <path
            key={`gs${i}`}
            d={`M${x} ${GROUND} l-1.5 -4 M${x} ${GROUND} l0.5 -5 M${x} ${GROUND} l2.5 -3.5`}
            fill="none"
            strokeWidth={0.8}
            className={anim('av-grass')}
            style={{ animationDelay: `${-rnd(i, 42) * 2.6}s` }}
          />
        )
      })}

      {/* Magiekreise am Boden */}
      {c.magic >= 2 && (
        <g fill="none" filter={glow}>
          <ellipse cx={120} cy={GROUND} rx={46} ry={8} strokeDasharray="6 3" className={anim('av-dash')} />
          <ellipse cx={120} cy={GROUND} rx={38} ry={6} strokeWidth={0.8} className={anim('av-pulse')} />
          {Array.from({ length: 8 }, (_, i) => (
            <circle
              key={`em${i}`}
              cx={f1(82 + i * 10 + rnd(i, 61) * 6)}
              cy={GROUND - 2}
              r={0.9}
              fill={W}
              stroke="none"
              className={anim('av-rise')}
              style={{ opacity: 0, animationDelay: `${-rnd(i, 62) * 3.5}s` }}
            />
          ))}
        </g>
      )}
      {c.magic >= 4 && (
        <g fill="none" filter={glow}>
          <ellipse cx={120} cy={GROUND} rx={64} ry={11} strokeWidth={0.9} strokeDasharray="1 4" />
          {Array.from({ length: 10 }, (_, i) => {
            const ang = (i / 10) * Math.PI * 2
            return <path key={i} d={star4(120 + Math.cos(ang) * 55, GROUND + Math.sin(ang) * 9.5, 2)} fill={W} stroke="none" />
          })}
        </g>
      )}
    </g>
  )
}

/* ---------- Begleiter ---------- */

function Deer({ x, y, s, ids }: { x: number; y: number; s: number; ids: Ids }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${-s} ${s})`} filter={`url(#${ids.glow})`} strokeOpacity={0.9}>
      <ellipse cx={0} cy={0} rx={10} ry={5.5} fill={W} fillOpacity={0.08} />
      <path d="M6 -3 L10 -12 L13 -11 L10 -2" fill={W} fillOpacity={0.08} />
      <ellipse cx={14} cy={-13} rx={4.5} ry={2.6} transform="rotate(20 14 -13)" fill={W} fillOpacity={0.08} />
      <path d="M12 -15 L10 -24 L6 -28 M10 -24 L13 -29 M11 -19 L7 -20 M14 -15 L17 -23 L21 -26 M17 -23 L16 -29" fill="none" strokeWidth={1} />
      <path d="M-7 3 L-8 13 M-3 4 L-3 14 M4 4 L5 14 M8 3 L9 13 M-10 -1 L-13 -4" fill="none" strokeWidth={1} />
      <circle cx={15} cy={-14} r={0.8} fill={W} stroke="none" />
    </g>
  )
}

function Wisp({ x, y, ids, anim, delay }: { x: number; y: number; ids: Ids; anim: Anim; delay: number }) {
  return (
    <g className={anim('av-wander')} style={{ animationDelay: `${delay}s` }} filter={`url(#${ids.glow})`}>
      <path d={`M${x} ${y + 4} Q${x - 4} ${y} ${x} ${y - 9} Q${x + 4} ${y} ${x} ${y + 4} Z`} fill={W} fillOpacity={0.15} />
      <circle cx={x} cy={y + 0.5} r={2} fill={W} stroke="none" className={anim('av-pulse')} />
    </g>
  )
}

function Companions({ c, ids, anim }: { c: AvatarCounts; ids: Ids; anim: Anim }) {
  return (
    <g>
      {c.spirit >= 1 && <Wisp x={186} y={118} ids={ids} anim={anim} delay={0} />}
      {c.spirit >= 2 && <Wisp x={44} y={182} ids={ids} anim={anim} delay={-1.3} />}
      {c.spirit >= 3 && (
        <g className={anim('av-hover')} style={{ animationDelay: '-1.4s', transformOrigin: '196px 158px' }}>
          <Deer x={196} y={158} s={c.spirit >= 4 ? 1.3 : 1} ids={ids} />
        </g>
      )}
    </g>
  )
}

/* ---------- Grimoire ---------- */

function Grimoire({ n, ids, anim }: { n: number; ids: Ids; anim: Anim }) {
  if (n < 1) return null
  const x = 62
  const y = 150
  const glow = `url(#${ids.glow})`
  return (
    <g>
      <ellipse cx={x} cy={y + 26} rx={13} ry={2.6} fill={W} fillOpacity={0.45} stroke="none" filter={glow} className={anim('av-hover-shadow')} />
      <g className={anim('av-hover')} style={{ transformOrigin: `${x}px ${y}px` }}>
      <g filter={n >= 7 ? glow : undefined}>
        {n >= 7 &&
          Array.from({ length: 10 }, (_, i) => {
            const ang = (i / 10) * Math.PI * 2
            return <line key={i} x1={f1(x + Math.cos(ang) * 17)} y1={f1(y + Math.sin(ang) * 17)} x2={f1(x + Math.cos(ang) * 23)} y2={f1(y + Math.sin(ang) * 23)} strokeOpacity={0.7} />
          })}
        {n >= 4 ? (
          <g>
            <path d={`M${x} ${y + 9} Q${x - 8} ${y + 5} ${x - 17} ${y + 8} L${x - 17} ${y - 8} Q${x - 8} ${y - 11} ${x} ${y - 7} Z`} />
            <path d={`M${x} ${y + 9} Q${x + 8} ${y + 5} ${x + 17} ${y + 8} L${x + 17} ${y - 8} Q${x + 8} ${y - 11} ${x} ${y - 7} Z`} />
            <path
              d={`M${x - 14} ${y - 5} q6 -2 11 0 M${x - 14} ${y - 1} q6 -2 11 0 M${x - 14} ${y + 3} q6 -2 11 0 M${x + 3} ${y - 5} q6 -2 11 0 M${x + 3} ${y - 1} q6 -2 11 0`}
              fill="none"
              strokeWidth={0.6}
              strokeOpacity={0.8}
            />
            <path d={star4(x + 9, y + 3.5, 3)} fill={W} stroke="none" filter={glow} className={anim('av-pulse')} />
            <path d={`M${x - 6} ${y - 10} L${x - 8} ${y - 20} M${x} ${y - 9} L${x} ${y - 22} M${x + 6} ${y - 10} L${x + 8} ${y - 20}`} strokeWidth={0.7} strokeOpacity={0.5} />
          </g>
        ) : (
          <g transform={`rotate(-10 ${x} ${y})`}>
            <path d={`M${x - 9} ${y - 12} L${x + 11} ${y - 12} L${x + 11} ${y + 12} L${x - 9} ${y + 12} Z`} strokeWidth={1.4} />
            <path d={`M${x - 9} ${y - 12} L${x - 11} ${y - 10} L${x - 11} ${y + 14} L${x - 9} ${y + 12}`} />
            <path d={`M${x - 11} ${y + 14} L${x + 9} ${y + 14} L${x + 11} ${y + 12}`} fill="none" />
            {n >= 3 && <path d={`M${x - 9} ${y + 13} L${x + 9} ${y + 13}`} strokeWidth={0.6} filter={glow} />}
            <circle cx={x + 1} cy={y} r={6.5} fill="none" strokeWidth={0.9} />
            <path d={star4(x + 1, y, 5)} fill={W} stroke="none" filter={n >= 2 ? glow : undefined} className={n >= 2 ? anim('av-pulse') : undefined} />
            {[
              [-7, -10],
              [9, -10],
              [-7, 10],
              [9, 10],
            ].map(([dx, dy]) => (
              <path key={`${dx}${dy}`} d={`M${x + dx - 1.5} ${y + dy} l1.5 -1.5 l1.5 1.5 l-1.5 1.5 Z`} strokeWidth={0.7} />
            ))}
          </g>
        )}
        {n >= 6 && (
          <g fill="none" filter={glow} className={anim('av-spin')} style={{ transformOrigin: `${x}px ${y - 26}px` }}>
            <circle cx={x} cy={y - 26} r={8} strokeWidth={0.9} />
            <path d={star4(x, y - 26, 6)} strokeWidth={0.8} />
          </g>
        )}
      </g>
      {n >= 5 &&
        [0, 1, 2].map((i) => (
          <g key={`pg${i}`} className={anim('av-orbit')} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${-i * 2}s` }}>
            <rect x={x + 22} y={y - 3} width={5} height={7} transform={`rotate(${15 + i * 10} ${x + 24} ${y})`} strokeWidth={0.8} />
          </g>
        ))}
      {n >= 4 &&
        [0, 1, 2, 3].map((i) => (
          <circle
            key={`gm${i}`}
            cx={x - 6 + i * 4}
            cy={y - 10}
            r={0.9}
            fill={W}
            stroke="none"
            filter={glow}
            className={anim('av-rise')}
            style={{ opacity: 0, animationDelay: `${-i * 0.9}s` }}
          />
        ))}
      </g>
    </g>
  )
}

/* ---------- Schwert ---------- */

function Sword({ n, magic, ids, anim }: { n: number; magic: boolean; ids: Ids; anim: Anim }) {
  const L = [50, 66, 80, 80, 80, 86, 86][Math.min(n, 6)]
  const w = n >= 5 ? 7.6 : n >= 2 ? 5.2 : 4.6
  const grip = n >= 5 ? 17 : 12
  const h = w / 2
  const blade =
    n === 0
      ? `M${-h} 2 L${-h} 14 l1 2 l-1 2 L${-h} 30 l1.2 1.5 l-1.2 1.5 L${-h} ${L - 8} L0 ${L} L${h} ${L - 8} L${h} 24 l-1 2 l1 2 L${h} 2 Z`
      : `M${-h} 2 L${-h} ${L - 9} L0 ${L} L${h} ${L - 9} L${h} 2 Z`
  const glow = `url(#${ids.glow})`
  return (
    <g>
      <clipPath id={ids.clip}>
        <path d={blade} />
      </clipPath>
      <g filter={n >= 6 ? glow : undefined}>
        <path d={blade} strokeWidth={1.2} />
        <path d={`M0 2 L${h} 2 L${h} ${L - 9} L0 ${L} Z`} fill={`url(#${ids.tone})`} stroke="none" opacity={n === 0 ? 1 : 0.6} />
        <g clipPath={`url(#${ids.clip})`}>
          <g className={anim('av-glint')} style={{ opacity: 0 }}>
            <path d={`M${-h - 1} 0 L${h + 1} -6 L${h + 1} -2 L${-h - 1} 4 Z`} fill={W} fillOpacity={0.85} stroke="none" />
          </g>
        </g>
        {n >= 2 && <line x1={0} y1={5} x2={0} y2={L - 14} strokeWidth={0.7} />}
        {n >= 4 &&
          [12, 24, 36, 48, 60].map((y, i) => (
            <path key={y} d={`M-1.2 ${y} l1.2 -2 l1.2 2 ${i % 2 ? 'm-1.2 -2 l0 4' : 'l-1.2 2 Z'}`} fill="none" strokeWidth={0.7} filter={glow} />
          ))}
      </g>
      {n >= 3 ? (
        <g>
          <path d="M-11 -1 Q-6 -3.4 0 -1 Q6 -3.4 11 -1 L11 1.8 Q6 0.4 0 2.2 Q-6 0.4 -11 1.8 Z" />
          <circle cx={-12} cy={0.4} r={1.6} />
          <circle cx={12} cy={0.4} r={1.6} />
        </g>
      ) : (
        <rect x={-8} y={-1} width={16} height={3} />
      )}
      {n >= 6 && (
        <g filter={glow}>
          <path d="M-4 -1 Q-14 -4 -19 -13 Q-12 -7 -4 -4 Z M4 -1 Q14 -4 19 -13 Q12 -7 4 -4 Z" />
          <circle cx={0} cy={0.5} r={2} fill={W} stroke="none" className={anim('av-pulse')} />
        </g>
      )}
      <rect x={-1.8} y={-1 - grip} width={3.6} height={grip} />
      <path d={Array.from({ length: Math.floor(grip / 3) }, (_, i) => `M-1.8 ${-3 - i * 3} L1.8 ${-4.5 - i * 3}`).join(' ')} strokeWidth={0.6} />
      <circle cx={0} cy={-3.6 - grip} r={2.7} />
      {n >= 3 && <circle cx={0} cy={-3.6 - grip} r={1} fill={W} stroke="none" />}
      {magic && (
        <g fill="none" filter={glow} className={anim('av-pulse')}>
          <path d={`M0 4 Q7 ${f1(L * 0.12)} 0 ${f1(L * 0.25)} T0 ${f1(L * 0.5)} T0 ${f1(L * 0.75)} T0 ${L - 2}`} strokeWidth={1} />
          <path d={`M0 4 Q-7 ${f1(L * 0.12)} 0 ${f1(L * 0.25)} T0 ${f1(L * 0.5)} T0 ${f1(L * 0.75)} T0 ${L - 2}`} strokeWidth={0.7} strokeOpacity={0.7} />
        </g>
      )}
    </g>
  )
}

/* ---------- Figur ---------- */

/** Haare relativ zum Kopfmittelpunkt: seitlich gescheitelt, Strähnen fallen nach links, Zopf hinten */
const BANG_EDGE: P[] = [
  [12, -7], [7, -4], [6, -9], [1, -2], [0, -10], [-6, 0], [-7, -8], [-12, 2], [-12, -5],
]
const HAIR: P[] = [[-15, 8], [-17, -2], [-17, -12], [-12, -19], [-4, -23], [5, -23], [13, -19], [17, -11], [17, -2], [16, 5], [13, -1], ...BANG_EDGE]
const BANGS: P[] = [[-14, -9], [-6, -14], [6, -14], [14, -9], [15, 4], [13, -1], ...BANG_EDGE, [-15, 6]]
const shape = (pts: P[], hx: number, hy: number) => 'M' + pts.map(([x, y]) => `${hx + x} ${hy + y}`).join(' L') + ' Z'

type EyeMode = 'open' | 'tired' | 'light' | 'demon'

function Eye({ x, y, side, mode, ids, anim }: { x: number; y: number; side: -1 | 1; mode: EyeMode; ids: Ids; anim: Anim }) {
  if (mode === 'tired') {
    return (
      <g>
        <path d={`M${x - 2.8} ${y + 0.6} A2.8 3 0 0 0 ${x + 2.8} ${y + 0.6} Z`} strokeWidth={0.9} />
        <circle cx={x} cy={y + 2} r={1.1} fill={W} stroke="none" />
        <path d={`M${x - side * 4} ${y + 0.4} Q${x} ${y - 0.8} ${x + side * 4.6} ${y + 0.8}`} fill="none" strokeWidth={1.9} />
      </g>
    )
  }
  const glowing = mode !== 'open'
  return (
    <g>
      <ellipse
        cx={x}
        cy={y + 0.8}
        rx={2.8}
        ry={3.4}
        strokeWidth={0.9}
        fill={glowing ? W : B}
        filter={glowing ? `url(#${ids.glow})` : undefined}
        className={glowing ? anim('av-pulse') : undefined}
      />
      {mode === 'open' && (
        <g>
          <ellipse cx={x} cy={y + 1.2} rx={1.6} ry={2.1} fill={W} stroke="none" />
          <circle cx={x + 0.8} cy={y} r={0.75} fill={B} stroke="none" />
        </g>
      )}
      {mode === 'demon' && <ellipse cx={x} cy={y + 0.9} rx={0.55} ry={2.6} fill={B} stroke="none" />}
      <path d={`M${x - side * 4.2} ${y - 1.6} Q${x + side * 0.4} ${y - 4.8} ${x + side * 4.9} ${y - 1} l${side * 1.3} 0.9`} fill="none" strokeWidth={1.9} />
      <path d={`M${x - side * 1.6} ${y + 5} L${x + side * 2.6} ${y + 4.4}`} fill="none" strokeWidth={0.8} strokeOpacity={0.7} />
    </g>
  )
}

/** Engelsflügel (linke Seite): Flügelbogen mit drei Federreihen, rechts gespiegelt */
function AngelWing({ sY }: { sY: number }) {
  const P0: P = [108, sY + 8]
  const P1: P = [94, sY - 22]
  const P2: P = [68, sY - 46]
  const P3: P = [40, sY - 28]
  const bez = (t: number): P => {
    const u = 1 - t
    const k0 = u * u * u
    const k1 = 3 * u * u * t
    const k2 = 3 * u * t * t
    const k3 = t * t * t
    return [k0 * P0[0] + k1 * P1[0] + k2 * P2[0] + k3 * P3[0], k0 * P0[1] + k1 * P1[1] + k2 * P2[1] + k3 * P3[1]]
  }
  const rows = [
    { n: 11, len: (t: number) => 24 + 30 * t, w: 3.6, drop: 0 },
    { n: 9, len: (t: number) => 13 + 14 * t, w: 3.2, drop: 1 },
    { n: 8, len: (t: number) => 6 + 5 * t, w: 2.8, drop: 0 },
  ]
  return (
    <g>
      {rows.map((r, ri) =>
        Array.from({ length: r.n }, (_, k) => {
          const t = 0.12 + (k / (r.n - 1)) * 0.88
          const [bx, by] = bez(t)
          const th = ((95 + 30 * t) * Math.PI) / 180
          const dx = Math.cos(th)
          const dy = Math.sin(th)
          const len = r.len(t)
          const px = bx + dx * r.drop
          const py = by + dy * r.drop
          const mx = px + dx * len * 0.5
          const my = py + dy * len * 0.5
          const nx = -dy * r.w * 2
          const ny = dx * r.w * 2
          return (
            <g key={`${ri}-${k}`}>
              <path
                d={`M${f1(px)} ${f1(py)} Q${f1(mx + nx)} ${f1(my + ny)} ${f1(px + dx * len)} ${f1(py + dy * len)} Q${f1(mx - nx)} ${f1(my - ny)} ${f1(px)} ${f1(py)} Z`}
                strokeWidth={0.9}
              />
              <path d={`M${f1(px)} ${f1(py)} L${f1(px + dx * len * 0.85)} ${f1(py + dy * len * 0.85)}`} strokeWidth={0.5} strokeOpacity={0.7} />
            </g>
          )
        }).reverse(),
      )}
      <path d={`M${P0[0]} ${P0[1]} C${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]} ${P3[0]} ${P3[1]}`} fill="none" strokeWidth={1.7} />
    </g>
  )
}

function Figure({ c, path, ids, anim }: { c: AvatarCounts; path: AvatarPath; ids: Ids; anim: Anim }) {
  const hatch = `url(#${ids.tone})`
  const mail = `url(#${ids.mail})`
  const glow = `url(#${ids.glow})`
  const hunched = c.posture === 0
  const raised = c.posture >= 2
  const hx = 120
  const hy = hunched ? 97 : 94
  const sY = hunched ? 121 : 118
  const scars = 3 - c.scar
  const f = c.fusion
  const demon = path === 'demon'
  const hood = c.head === 1
  const lightHair = f >= 6 && !demon

  const shL: P = [103, sY + 3]
  const shR: P = [137, sY + 3]
  const elL: P = raised ? [96, sY + 22] : [98, sY + 29]
  const haL: P = raised ? [82, sY + 34] : [96, sY + 55]
  const elR: P = raised ? [150, sY - 2] : [149, sY + 25]
  const haR: P = raised ? [157, sY - 26] : [159, sY + 39]
  const hipL: P = [113, 180]
  const knL: P = [110, 214]
  const anL: P = [108, 245]
  const hipR: P = [127, 180]
  const knR: P = [131, 214]
  const anR: P = [134, 245]
  const arms: [P, P, P][] = [
    [shL, elL, haL],
    [shR, elR, haR],
  ]

  const shoe = (x: number, dir: number) => `M${x - dir * 5} 250 L${x - dir * 6} 243 L${x + dir * 3} 242 L${x + dir * 9} 247 L${x + dir * 9} 250 Z`
  const hand = (el: P, ha: P) => {
    const [x, y] = lerp(el, ha, 1.09)
    const r = f1(angle(el, ha) - 90)
    const cx = f1(x)
    const cy = f1(y)
    return c.arms >= 2 ? (
      <g transform={`rotate(${r} ${cx} ${cy})`}>
        <path d={`M${f1(cx - 4)} ${f1(cy - 3)} L${f1(cx + 4)} ${f1(cy - 3)} L${f1(cx + 3.4)} ${f1(cy + 4)} L${f1(cx - 3.4)} ${f1(cy + 4)} Z`} />
        <path d={`M${f1(cx - 3.6)} ${cy} L${f1(cx + 3.6)} ${cy} M${f1(cx - 3.4)} ${f1(cy + 2)} L${f1(cx + 3.4)} ${f1(cy + 2)}`} strokeWidth={0.6} />
      </g>
    ) : (
      <ellipse cx={cx} cy={cy} rx={3.4} ry={4} transform={`rotate(${r} ${cx} ${cy})`} />
    )
  }
  const guard: P = raised ? [haR[0] + 0.643 * 6, haR[1] - 0.766 * 6] : [haR[0], haR[1] + 6]

  const capePath =
    c.cape >= 4
      ? `M101 ${sY} C 86 ${sY + 50}, 70 210, 52 252 L 188 252 C 170 210, 154 ${sY + 50}, 139 ${sY} Z`
      : c.cape >= 2
        ? `M101 ${sY} L90 242 L150 242 L139 ${sY} Z`
        : `M101 ${sY} L94 200 L104 196 L112 204 L120 198 L128 204 L136 196 L146 200 L139 ${sY} Z`
  const wingPath = `M108 ${sY + 6} L62 ${sY - 34} L36 ${sY + 18} Q44 ${sY + 14} 48 ${sY + 22} L52 ${sY + 50} Q58 ${sY + 44} 64 ${sY + 52} L72 ${sY + 66} Q84 ${sY + 50} 102 ${sY + 46} Z`

  return (
    <g>
      {/* ---- Verschmelzung (hinter der Figur) ---- */}
      {f >= 1 &&
        (demon ? (
          <g>
            {[
              'M96 200 Q78 150 92 104 Q96 132 104 140 Q100 110 112 76 Q114 112 120 124 Z',
              'M144 200 Q162 150 148 104 Q144 132 136 140 Q140 110 128 76 Q126 112 120 124 Z',
            ].map((d, i) => (
              <path key={i} d={d} fill={hatch} strokeWidth={1} className={anim('av-waver')} style={{ animationDelay: `${-i * 0.6}s`, transformOrigin: '120px 200px' }} />
            ))}
          </g>
        ) : (
          <g filter={glow}>
            <ellipse cx={120} cy={168} rx={52} ry={92} fill={W} fillOpacity={0.05} stroke="none" />
            {Array.from({ length: 8 }, (_, i) => (
              <g key={i} className={anim('av-orbit')} style={{ transformOrigin: '120px 236px', animationDelay: `${-i * 0.75}s` }}>
                <path d={`M162 ${236 + (i % 3) * 3} q3 -4 7 0 q-3 4 -7 0 Z`} strokeWidth={0.8} />
              </g>
            ))}
          </g>
        ))}
      {f >= 3 &&
        (demon ? (
          <g>
            {[undefined, MIRROR].map((tr, i) => (
              <g key={i} transform={tr}>
                <g className={anim('av-flap')} style={{ transformOrigin: `108px ${sY + 6}px` }}>
                <path d={wingPath} strokeWidth={1.3} />
                <path d={wingPath} fill={hatch} stroke="none" />
                <path d={`M62 ${sY - 34} L48 ${sY + 22} M62 ${sY - 34} L64 ${sY + 52} M62 ${sY - 34} L86 ${sY + 50}`} fill="none" strokeWidth={1.1} />
                <path d={`M62 ${sY - 34} l-3 -6`} strokeWidth={1.6} />
                </g>
              </g>
            ))}
          </g>
        ) : (
          <g filter={glow}>
            {[undefined, MIRROR].map((tr, i) => (
              <g key={i} transform={tr}>
                <g className={anim('av-flap')} style={{ transformOrigin: `108px ${sY + 8}px` }}>
                  <AngelWing sY={sY} />
                </g>
              </g>
            ))}
          </g>
        ))}
      {f >= 6 && demon && <path d="M126 178 Q160 196 168 226 Q172 240 186 238 L180 232 L192 230 L184 244 Q166 246 162 228 Q156 202 124 186 Z" />}

      {/* ---- Umhang ---- */}
      {c.cape >= 1 && (
        <g className={anim(c.cape >= 4 ? 'av-flutter-strong' : 'av-flutter')} style={{ transformOrigin: `120px ${sY}px` }}>
          <path d={capePath} />
          <path d={capePath} fill={hatch} stroke="none" opacity={0.8} />
          {c.cape >= 2 && c.cape < 4 && <path d="M91 236 L149 236" strokeWidth={0.9} />}
          {c.cape >= 4 && Array.from({ length: 13 }, (_, i) => <path key={i} d={star4(58 + i * 10.4, 246, 2.2)} fill={W} stroke="none" />)}
        </g>
      )}

      {/* ---- Zopf ---- */}
      {!hood && (
        <g transform={hunched ? `rotate(9 ${hx} ${hy + 16})` : undefined}>
          <path
            d={`M${hx + 9} ${hy + 2} Q${hx + 22} ${hy + 4} ${hx + 25} ${hy + 20} L${hx + 20} ${hy + 16} L${hx + 19} ${hy + 23} Q${hx + 15} ${hy + 10} ${hx + 7} ${hy + 8} Z`}
            fill={lightHair ? W : B}
          />
          <path d={`M${hx + 14} ${hy + 3} l-1 5`} strokeWidth={1.6} stroke={lightHair ? B : W} />
        </g>
      )}

      {/* ---- Schild auf dem Rücken ---- */}
      {c.shield === 1 && (
        <g>
          <circle cx={99} cy={sY + 26} r={20} strokeWidth={1.5} />
          <circle cx={99} cy={sY + 26} r={16} strokeWidth={0.7} />
          <path d={`M83 ${sY + 20} L103 ${sY + 20} M82 ${sY + 32} L103 ${sY + 32}`} strokeWidth={0.7} />
          <circle cx={99} cy={sY + 26} r={4} />
        </g>
      )}
      {c.shield >= 2 && (
        <g>
          <path d={`M80 ${sY + 4} L118 ${sY + 4} L118 ${sY + 30} Q118 ${sY + 50} 99 ${sY + 62} Q80 ${sY + 50} 80 ${sY + 30} Z`} strokeWidth={1.5} />
          <path d={`M83 ${sY + 7} L115 ${sY + 7} L115 ${sY + 30} Q115 ${sY + 47} 99 ${sY + 58} Q83 ${sY + 47} 83 ${sY + 30} Z`} fill="none" strokeWidth={0.7} />
          <path d={star4(90, sY + 28, 6)} fill={W} stroke="none" />
        </g>
      )}

      {/* ---- Beine ---- */}
      <path d={bent(hipL, knL, anL, 7.5, 5.6, 4.3)} />
      <path d={bent(hipR, knR, anR, 7.5, 5.6, 4.3)} />
      <path d={bent(hipR, knR, anR, 3.2, 2.4, 1.8)} transform="translate(3 0)" fill={hatch} stroke="none" />
      {scars >= 2 && <path d={`${across(hipL, knL, 0.45, 7)} ${across(hipL, knL, 0.58, 6.6)}`} fill="none" strokeWidth={1.1} />}
      {c.legs >= 1 &&
        [anL[0], anR[0]].map((x) => (
          <g key={`bt${x}`}>
            <path d={`M${x - 6} 222 L${x + 6} 222 L${x + 5.4} 243 L${x - 5.4} 243 Z`} />
            <path d={`M${x - 6.4} 222 L${x + 6.4} 222 L${x + 6} 227 L${x - 6} 227 Z`} />
          </g>
        ))}
      <path d={shoe(anL[0], -1)} />
      <path d={shoe(anR[0], 1)} />
      {c.legs >= 2 &&
        [
          [knL, anL],
          [knR, anR],
        ].map(([k, an], i) => (
          <g key={`gr${i}`}>
            <path d={limb([k[0], k[1] + 5], [an[0], 222], 5.2, 4.6)} />
            <circle cx={k[0]} cy={k[1]} r={5} />
            <path d={`M${k[0] - 5} ${k[1] - 2} L${k[0] - 8} ${k[1] - 5} M${k[0] + 5} ${k[1] - 2} L${k[0] + 8} ${k[1] - 5}`} strokeWidth={0.9} />
            <circle cx={k[0]} cy={k[1]} r={1.2} fill={W} stroke="none" />
          </g>
        ))}
      {c.legs >= 3 && (
        <path
          d={`M${anL[0] - 8} 246 L${anL[0] + 4} 245 M${anL[0] - 7} 248 L${anL[0] + 5} 247.5 M${anR[0] - 4} 245 L${anR[0] + 8} 246 M${anR[0] - 5} 247.5 L${anR[0] + 7} 248`}
          strokeWidth={0.7}
        />
      )}

      <g className={anim('av-breathe')}>
        {/* ---- Oberkörper ---- */}
        <path d="M107 175 L133 175 L135 185 L105 185 Z" />
        <path d={`M${hx - 4} ${hy + 12} L${hx + 4} ${hy + 12} L${hx + 4.5} ${sY + 3} L${hx - 4.5} ${sY + 3} Z`} />
        {c.armor >= 2 && (
          <g>
            <path d="M100 194 L140 194 L142 203 L98 203 Z" />
            <path d="M100 194 L140 194 L142 203 L98 203 Z" fill={mail} stroke="none" />
          </g>
        )}
        {c.armor >= 1 ? (
          <g>
            <path d={`M102 ${sY + 1} Q120 ${sY - 2} 138 ${sY + 1} L134 174 L139 196 L101 196 L106 174 Z`} strokeWidth={1.5} />
            <path d={`M128 ${sY + 2} L137.5 ${sY + 2} L139 196 L130 196 Z`} fill={hatch} stroke="none" />
            <path
              d={`M114 ${sY} L120 ${sY + 7} L126 ${sY} M116 ${sY + 4} L124 ${sY + 8} M124 ${sY + 4} L116 ${sY + 8} M116 ${sY + 9} L124 ${sY + 13} M124 ${sY + 9} L116 ${sY + 13}`}
              fill="none"
              strokeWidth={0.8}
            />
            <path d="M120 184 L120 196" fill="none" strokeWidth={0.6} strokeOpacity={0.7} />
          </g>
        ) : (
          <g>
            <path d={`M102 ${sY + 1} Q120 ${sY - 2} 138 ${sY + 1} L133 176 L107 176 Z`} strokeWidth={1.5} />
            <path d={`M128 ${sY + 2} L137.5 ${sY + 2} L132.8 175 L126 175 Z`} fill={hatch} stroke="none" />
            <path d={`M113 ${sY} L120 ${sY + 9} L127 ${sY}`} fill="none" strokeWidth={1} />
            <path d="M108 150 l3 4 M131 160 l-2 4" fill="none" strokeWidth={0.7} strokeOpacity={0.7} />
          </g>
        )}
        {c.armor >= 2 && <path d={`M106 ${sY + 40} L134 ${sY + 40} L134 172 L106 172 Z`} fill={mail} stroke="none" />}
        {scars >= 3 && <path d="M107 146 l4 -3 l1 5 l4 -4" fill="none" strokeWidth={0.9} />}
        {c.armor >= 3 && (
          <g>
            <path d={`M104 ${sY + 5} Q120 ${sY + 1} 136 ${sY + 5} L134 164 Q120 171 106 164 Z`} strokeWidth={1.5} />
            <path d={`M124 ${sY + 4} Q131 ${sY + 4} 136 ${sY + 5} L134 164 Q128 168 124 169 Z`} fill={hatch} stroke="none" />
            <path d={`M120 ${sY + 3} L120 169`} strokeWidth={0.8} />
            <path d="M106 165 Q120 174 134 165 L135 171 Q120 180 105 171 Z" />
          </g>
        )}
        {c.armor >= 4 && <path d={`M110 ${sY + 12} q4 6 0 12 M130 ${sY + 12} q-4 6 0 12 M110 156 q10 7 20 0`} fill="none" strokeWidth={0.7} />}
        {c.armor >= 5 && (
          <g>
            <path d={`M113 ${sY + 18} L127 ${sY + 18} L127 ${sY + 26} Q127 ${sY + 33} 120 ${sY + 37} Q113 ${sY + 33} 113 ${sY + 26} Z`} />
            <path d={star4(120, sY + 26, 5)} fill={W} stroke="none" />
          </g>
        )}

        {/* ---- Gürtel ---- */}
        {c.belt >= 1 && (
          <g>
            <rect x={105} y={172} width={30} height={5} />
            <rect x={117} y={171} width={6} height={7} />
            <line x1={120} y1={172} x2={120} y2={176} strokeWidth={0.7} />
          </g>
        )}
        {c.belt >= 2 && (
          <g>
            <rect x={124} y={177} width={8} height={9} rx={1.5} />
            <path d="M124 180 L132 180" strokeWidth={0.7} />
          </g>
        )}
        {c.belt >= 3 && (
          <g>
            <path d={limb([105, 179], [98, 203], 2.2, 1.4)} />
            <path d="M102 176 L110 179" strokeWidth={1.6} />
            <circle cx={108} cy={173} r={1.8} />
          </g>
        )}
        {c.belt >= 4 &&
          [136.5, 141].map((x, i) => (
            <g key={`po${x}`}>
              <rect x={x - 1} y={178 + i} width={2} height={3} />
              <circle cx={x} cy={184.5 + i} r={2.6} />
              <path d={`M${x - 2} ${185 + i} L${x + 2} ${185 + i}`} strokeWidth={0.6} />
            </g>
          ))}

        {/* ---- Schwert ---- */}
        <g transform={`translate(${f1(guard[0])} ${f1(guard[1])}) rotate(${raised ? -140 : 0})`}>
          <Sword n={c.sword} magic={c.magic >= 6} ids={ids} anim={anim} />
        </g>

        {/* ---- Arme ---- */}
        {arms.map(([sh, el, ha], i) => {
          const [mx, my] = lerp(el, ha, 0.6)
          const [ax, ay] = lerp(el, ha, 0.2)
          return (
            <g key={`arm${i}`}>
              <path d={bent(sh, el, ha, 5.4, 4.2, 3.3)} />
              {c.armor >= 2 && <path d={limb(sh, el, 5.2, 4)} fill={mail} stroke="none" />}
              {i === 1 && <path d={bent(sh, el, ha, 2.2, 1.6, 1.2)} transform="translate(2 0)" fill={hatch} stroke="none" />}
              {c.arms >= 1 && (
                <g>
                  <path d={limb(lerp(el, ha, 0.3), lerp(el, ha, 0.92), 4.6, 3.9)} />
                  <path d={across(el, ha, 0.6, 4.2)} strokeWidth={0.7} />
                </g>
              )}
              {c.arms >= 3 && <path d={star4(mx, my, 2.2)} fill={W} stroke="none" />}
              {hand(el, ha)}
              {i === 0 && scars >= 2 && c.arms < 1 && <path d={`${across(el, ha, 0.4, 4.4)} ${across(el, ha, 0.52, 4.2)}`} strokeWidth={1} />}
              {f >= 2 && (
                <path
                  d={demon ? `M${f1(ax)} ${f1(ay)} l2 4 l-3 3 l2 4` : `M${f1(ax)} ${f1(ay)} q3 6 0 12`}
                  fill="none"
                  strokeWidth={1.1}
                  filter={demon ? undefined : glow}
                />
              )}
            </g>
          )
        })}
        {/* Funken in der linken Hand */}
        {c.magic >= 1 && (
          <g filter={glow}>
            {[
              [-6, 6, 3.2],
              [5, 9, 2.4],
              [-2, 12, 2],
              [7, 2, 1.6],
            ].map(([dx, dy, r], i) => (
              <path key={i} d={star4(haL[0] + dx, haL[1] + dy, r)} fill={W} stroke="none" className={anim('av-spark')} style={{ animationDelay: `${-i * 0.3}s` }} />
            ))}
          </g>
        )}
        {/* Dämonenklauen */}
        {f >= 6 && demon && (
          <path d={`M${haL[0] - 3} ${haL[1] + 7} q-2 4 -5 5 M${haL[0]} ${haL[1] + 8} q-1 5 -3 7 M${haL[0] + 3} ${haL[1] + 7} q0 5 -1 7`} fill="none" strokeWidth={1.4} />
        )}

        {/* ---- Schultern ---- */}
        {c.shoulders >= 1 &&
          (c.shoulders >= 3 ? [undefined, MIRROR] : [undefined]).map((tr, i) => (
            <g key={`sh${i}`} transform={tr}>
              <path d={`M95 ${sY + 14} Q93 ${sY - 3} 109 ${sY - 2} L110 ${sY + 5} Q101 ${sY + 4} 99 ${sY + 15} Z`} strokeWidth={1.4} />
              {c.shoulders >= 2 && (
                <g>
                  <path d={`M93 ${sY + 19} Q92 ${sY + 8} 98 ${sY + 9} L99 ${sY + 15} Z`} />
                  <circle cx={104} cy={sY + 1} r={0.9} fill={W} stroke="none" />
                </g>
              )}
              {c.shoulders >= 4 && <path d={`M96 ${sY + 2} L86 ${sY - 12} L102 ${sY - 3} Z M101 ${sY - 2} L96 ${sY - 14} L106 ${sY - 3} Z`} />}
            </g>
          ))}
        {c.cape >= 3 &&
          Array.from({ length: 13 }, (_, i) => {
            const t = Math.PI + 0.25 + (i / 12) * (Math.PI - 0.5)
            return <circle key={`fur${i}`} cx={f1(120 + Math.cos(t) * 21)} cy={f1(sY + 6 + Math.sin(t) * 7)} r={2.6} strokeWidth={1} />
          })}
        {c.cape === 2 && <path d={star4(hx - 9, sY + 4, 3)} fill={W} stroke="none" />}

        {/* ---- Kopf ---- */}
        <g transform={hunched ? `rotate(9 ${hx} ${hy + 16})` : undefined}>
          {hood && (
            <path d={`M${hx - 19} ${hy + 16} Q${hx - 26} ${hy - 28} ${hx} ${hy - 29} Q${hx + 26} ${hy - 28} ${hx + 19} ${hy + 16} L${hx + 23} ${sY + 5} L${hx - 23} ${sY + 5} Z`} />
          )}
          {/* Hörner oder Geweih */}
          {f >= 4 &&
            (demon ? (
              <g>
                {[undefined, MIRROR].map((tr, i) => (
                  <g key={i} transform={tr}>
                    <path d={`M${hx - 9} ${hy - 13} Q${hx - 24} ${hy - 14} ${hx - 27} ${hy - 36} Q${hx - 21} ${hy - 23} ${hx - 5} ${hy - 19} Z`} strokeWidth={1.3} />
                    <path d={`M${hx - 15} ${hy - 15} l-1 -3 M${hx - 20} ${hy - 19} l-1.4 -2.6 M${hx - 24} ${hy - 25} l-1.6 -1.8`} strokeWidth={0.7} />
                  </g>
                ))}
              </g>
            ) : (
              <g filter={glow} fill="none">
                {[undefined, MIRROR].map((tr, i) => (
                  <path
                    key={i}
                    transform={tr}
                    d={`M${hx - 8} ${hy - 16} L${hx - 14} ${hy - 30} L${hx - 24} ${hy - 40} M${hx - 14} ${hy - 30} L${hx - 10} ${hy - 42} M${hx - 19} ${hy - 35} L${hx - 28} ${hy - 33} M${hx - 12} ${hy - 37} L${hx - 6} ${hy - 46}`}
                    strokeWidth={1.4}
                  />
                ))}
              </g>
            ))}
          <path
            d={`M${hx - 14} ${hy} C${hx - 14} ${hy - 19} ${hx + 14} ${hy - 19} ${hx + 14} ${hy} L${hx + 12} ${hy + 8} Q${hx + 9} ${hy + 14} ${hx} ${hy + 18} Q${hx - 9} ${hy + 14} ${hx - 12} ${hy + 8} Z`}
            strokeWidth={1.5}
          />
          <path d={`M${hx + 10} ${hy + 3} L${hx + 13.6} ${hy + 1} L${hx + 12} ${hy + 8} Q${hx + 9} ${hy + 13.5} ${hx + 5} ${hy + 16.5} Z`} fill={hatch} stroke="none" />
          {/* Nase, Mund */}
          <path d={`M${hx + 1} ${hy + 9} l1.2 2.4 l-1.6 0.3`} fill="none" strokeWidth={0.9} />
          <path
            d={
              raised
                ? `M${hx - 3.5} ${hy + 13} Q${hx} ${hy + 16.5} ${hx + 3.5} ${hy + 13} Z`
                : hunched
                  ? `M${hx - 2} ${hy + 14.4} L${hx + 2} ${hy + 14.4}`
                  : `M${hx - 3} ${hy + 13.8} L${hx + 1} ${hy + 13.8} Q${hx + 2.8} ${hy + 13.6} ${hx + 3.6} ${hy + 12.6}`
            }
            fill={raised ? B : 'none'}
            strokeWidth={0.9}
          />
          {/* Male */}
          {f >= 2 && (
            <path
              d={
                demon
                  ? `M${hx - 11} ${hy + 7} l2 2 l-1.5 2 l2 2 M${hx + 11} ${hy + 7} l-2 2 l1.5 2 l-2 2`
                  : `M${hx - 9} ${hy + 8} l-0.6 4.5 M${hx - 7} ${hy + 8} l-0.4 3.5 M${hx + 9} ${hy + 8} l0.6 4.5 M${hx + 7} ${hy + 8} l0.4 3.5`
              }
              fill="none"
              strokeWidth={1}
              filter={demon ? undefined : glow}
            />
          )}
          {scars >= 1 && <path d={`M${hx - 11} ${hy + 6} l3 5 M${hx - 11} ${hy + 8.5} l2 -0.6 M${hx - 10} ${hy + 10} l2 -0.6`} fill="none" strokeWidth={0.8} />}

          {/* Haare */}
          <g className={anim('av-sway')} style={{ transformOrigin: `${hx}px ${hy}px` }}>
            {hood ? (
              <path d={shape(BANGS, hx, hy)} strokeWidth={1.3} />
            ) : (
              <>
                <path d={shape(HAIR, hx, hy)} strokeWidth={1.6} fill={lightHair ? W : B} />
                {!lightHair && <path d={shape(HAIR, hx, hy)} fill={hatch} stroke="none" opacity={demon && f >= 6 ? 1 : 0.35} />}
                <path
                  d={`M${hx + 9} ${hy - 20} Q${hx + 2} ${hy - 14} ${hx - 1} ${hy - 4} M${hx + 1} ${hy - 22} Q${hx - 6} ${hy - 14} ${hx - 8} ${hy - 4} M${hx + 15} ${hy - 12} Q${hx + 12} ${hy - 8} ${hx + 11} ${hy - 4} M${hx - 12} ${hy - 16} Q${hx - 15} ${hy - 8} ${hx - 14} ${hy + 4}`}
                  fill="none"
                  strokeWidth={0.8}
                  stroke={lightHair ? B : W}
                />
              </>
            )}
          </g>
          {hood && (
            <path
              d={`M${hx - 17} ${hy + 12} Q${hx - 21} ${hy - 22} ${hx} ${hy - 23} Q${hx + 21} ${hy - 22} ${hx + 17} ${hy + 12} L${hx + 14} ${hy + 10} Q${hx + 16} ${hy - 17} ${hx} ${hy - 18} Q${hx - 16} ${hy - 17} ${hx - 14} ${hy + 10} Z`}
            />
          )}

          {/* Augenbrauen und Augen */}
          {!hunched && <path d={`M${hx - 3} ${hy - 0.4} L${hx - 10.5} ${hy - 2.4} M${hx + 3} ${hy - 0.4} L${hx + 10.5} ${hy - 2.4}`} fill="none" strokeWidth={1.3} />}
          <g className={hunched ? undefined : anim('av-eyes')} style={{ transformOrigin: `${hx}px ${hy + 5}px` }}>
            {([-1, 1] as const).map((side) => (
              <Eye
                key={side}
                x={hx + side * 6.5}
                y={hy + 4}
                side={side}
                mode={hunched ? 'tired' : f >= 5 ? (demon ? 'demon' : 'light') : 'open'}
                ids={ids}
                anim={anim}
              />
            ))}
          </g>

          {/* Krone oder Stirnreif */}
          {c.apex >= 1 ? (
            <g filter={glow}>
              <path
                d={`M${hx - 14} ${hy - 12} L${hx - 15} ${hy - 25} L${hx - 8} ${hy - 18} L${hx - 4} ${hy - 31} L${hx} ${hy - 20} L${hx + 4} ${hy - 31} L${hx + 8} ${hy - 18} L${hx + 15} ${hy - 25} L${hx + 14} ${hy - 12} Z`}
                strokeWidth={1.4}
              />
              <path d={`M${hx - 14} ${hy - 15} L${hx + 14} ${hy - 15}`} strokeWidth={0.8} />
              {[-8, 0, 8].map((dx) => (
                <circle key={dx} cx={hx + dx} cy={hy - 13.5} r={1.2} fill={W} stroke="none" />
              ))}
            </g>
          ) : (
            c.head >= 2 && (
              <g>
                <path d={`M${hx - 15} ${hy - 6} Q${hx} ${hy - 12} ${hx + 15} ${hy - 6}`} fill="none" strokeWidth={2} />
                <path
                  d={`M${hx} ${hy - 13} l2.4 3 l-2.4 3 l-2.4 -3 Z`}
                  fill={c.head >= 3 ? W : B}
                  filter={c.head >= 3 ? glow : undefined}
                  className={c.head >= 3 ? anim('av-pulse') : undefined}
                />
              </g>
            )
          )}
        </g>
      </g>
    </g>
  )
}
