import { useId, type ReactNode } from 'react'
import type { AvatarCounts } from '../../domain/avatar'

/*
 * Dystopischer Avatar im Anime-Linienstil: nur weiße Linien auf Schwarz,
 * Schatten als Manga-Rasterpunkte.
 * Gezeichnet wird anhand der Zähler aus domain/avatar (z. B. mouth 2 = Gasmaske).
 */

const W = '#f4f4f5'
const B = '#000'
const GROUND = 250

/** feste Pseudo-Zufallswerte (stabil zwischen Renderings) */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const BUILDINGS = [
  { x: 4, w: 26, h: 104, jag: 9 },
  { x: 204, w: 30, h: 118, jag: 11 },
  { x: 32, w: 18, h: 66, jag: 7 },
  { x: 180, w: 22, h: 76, jag: 8 },
  { x: 54, w: 20, h: 50, jag: 6 },
  { x: 160, w: 18, h: 46, jag: 5 },
  { x: 0, w: 8, h: 140, jag: 12 },
  { x: 232, w: 8, h: 150, jag: 10 },
  { x: 76, w: 14, h: 34, jag: 4 },
  { x: 146, w: 14, h: 30, jag: 4 },
  { x: 110, w: 20, h: 22, jag: 3 },
]
const STARS = [
  [28, 40],
  [74, 30],
  [112, 44],
  [150, 32],
  [176, 60],
]
const CROWS = [
  [152, 62],
  [166, 54],
  [58, 70],
  [96, 52],
  [212, 92],
]

export function Avatar({ c, className, animate = true }: { c: AvatarCounts; className?: string; animate?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const ids: Ids = { glow: `glow-${uid}`, tone: `tone-${uid}` }
  const glow = ids.glow
  const a = (cls: string) => (animate ? cls : undefined)

  return (
    <svg viewBox="0 0 240 280" className={className} role="img" aria-label="Dein Avatar">
      <defs>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id={ids.tone} width={3} height={3} patternUnits="userSpaceOnUse">
          <circle cx={1.5} cy={1.5} r={0.6} fill={W} fillOpacity={0.6} />
        </pattern>
      </defs>
      <rect width="240" height="280" fill={B} />

      <g stroke={W} fill={B} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        {/* Himmel */}
        {STARS.slice(0, c.star).map(([x, y], i) => (
          <g key={`s${i}`} className={a('av-twinkle')} style={{ animationDelay: `${i * 0.7}s` }}>
            <line x1={x - 3} y1={y} x2={x + 3} y2={y} />
            <line x1={x} y1={y - 3} x2={x} y2={y + 3} />
          </g>
        ))}
        {c.moon >= 1 && (
          <g>
            <circle cx={198} cy={50} r={22} />
            <path d="M198 28 A22 22 0 0 1 198 72 A15 22 0 0 0 198 28 Z" fill={`url(#${ids.tone})`} stroke="none" />
            <circle cx={190} cy={44} r={4} strokeOpacity={0.5} />
            <circle cx={203} cy={60} r={2.5} strokeOpacity={0.5} />
            {c.moon >= 2 && <path d="M186 31 l7 10 l-5 7 l10 7 l-3 10" fill="none" strokeWidth={1.6} />}
          </g>
        )}
        {c.searchlight >= 1 && (
          <polygon
            points="40,250 4,40 34,32"
            fill={W}
            fillOpacity={0.07}
            stroke="none"
            className={a('av-sweep')}
            style={{ transformOrigin: '40px 250px' }}
          />
        )}
        {c.searchlight >= 2 && (
          <polygon
            points="206,250 186,30 216,28"
            fill={W}
            fillOpacity={0.07}
            stroke="none"
            className={a('av-sweep-rev')}
            style={{ transformOrigin: '206px 250px' }}
          />
        )}

        {/* Ruinen */}
        <g strokeOpacity={0.55}>
          {BUILDINGS.slice(0, c.building).map((b, i) => {
            const top = GROUND - b.h
            const d = `M${b.x} ${GROUND} L${b.x} ${top} L${b.x + b.w * 0.35} ${top + b.jag} L${b.x + b.w * 0.6} ${top - b.jag * 0.4} L${b.x + b.w} ${top + b.jag * 1.2} L${b.x + b.w} ${GROUND} Z`
            const windows: ReactNode[] = []
            for (let y = top + b.jag + 8, r = 0; y < GROUND - 8; y += 12, r++) {
              for (let x = b.x + 4, k = 0; x < b.x + b.w - 5; x += 8, k++) {
                if (rnd(i * 31 + r, k) > 0.55) windows.push(<rect key={`${r}-${k}`} x={x} y={y} width={3} height={4} strokeOpacity={0.6} />)
              }
            }
            return (
              <g key={`b${i}`}>
                <path d={d} />
                {windows}
              </g>
            )
          })}
        </g>
        {c.tower >= 1 && (
          <g>
            <path d="M44 250 L52 104 L60 250" fill="none" />
            {[230, 205, 180, 155, 130].map((y, i) => (
              <path key={i} d={`M${44 + (250 - y) * 0.053} ${y} L${60 - (250 - y - 25) * 0.053} ${y - 25}`} fill="none" strokeOpacity={0.7} />
            ))}
            <rect x={45} y={96} width={14} height={8} />
            <circle cx={52} cy={92} r={2} fill={W} className={a('av-blink')} />
          </g>
        )}
        {c.monolith >= 1 && (
          <g>
            <rect x={212} y={150} width={14} height={100} />
            <line x1={219} y1={158} x2={219} y2={242} strokeOpacity={0.4} />
          </g>
        )}
        {c.banner >= 1 && (
          <g>
            <line x1={22} y1={250} x2={22} y2={146} />
            <path d="M22 148 L52 154 L46 160 L54 168 L22 170 Z" className={a('av-flutter')} style={{ transformOrigin: '22px 158px' }} />
          </g>
        )}
        {CROWS.slice(0, c.crow).map(([x, y], i) => (
          <path key={`c${i}`} d={`M${x - 5} ${y} q2.5 -3 5 0 q2.5 -3 5 0`} fill="none" className={a('av-glide')} style={{ animationDelay: `${i * 0.9}s` }} />
        ))}

        {/* Boden */}
        <rect x={0} y={GROUND} width={240} height={30} fill={`url(#${ids.tone})`} stroke="none" opacity={0.5} />
        <line x1={0} y1={GROUND} x2={240} y2={GROUND} />
        {[18, 64, 182, 220].map((x, i) => (
          <path key={`r${i}`} d={`M${x} ${GROUND} l4 -5 l5 2 l3 3`} fill="none" strokeOpacity={0.6} />
        ))}
        {c.trail >= 1 &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse key={`t${i}`} cx={20 + i * 14} cy={262 - (i % 2) * 4} rx={3} ry={1.6} strokeOpacity={0.6} />
          ))}

        {/* Drohnen */}
        {c.drone >= 1 && <Drone x={182} y={66} beam={c.drone >= 2} cls={a('av-bob')} />}
        {c.drone >= 3 && <Drone x={60} y={98} beam={false} cls={a('av-bob-slow')} />}

        {/* Manga-Konzentrationslinien hinter der Lichtgestalt */}
        {c.apex >= 1 &&
          Array.from({ length: 44 }, (_, i) => {
            const ang = (i / 44) * Math.PI * 2 + rnd(i, 11) * 0.08
            const inner = 78 + rnd(i, 12) * 40
            const w = 0.012 + rnd(i, 13) * 0.02
            const pt = (r: number, d: number) => `${f1(120 + Math.cos(ang + d) * r * 0.9)},${f1(160 + Math.sin(ang + d) * r * 1.15)}`
            return <polygon key={`ray${i}`} points={`${pt(220, -w)} ${pt(220, w)} ${pt(inner, 0)}`} fill={W} fillOpacity={0.3} stroke="none" />
          })}

        {/* Echos */}
        {c.echo >= 1 && (
          <g opacity={0.18} transform="translate(-18 0)">
            <Figure c={c} ids={ids} anim={a} />
          </g>
        )}
        {c.echo >= 2 && (
          <g opacity={0.12} transform="translate(18 0)">
            <Figure c={c} ids={ids} anim={a} />
          </g>
        )}

        <g filter={c.apex >= 1 ? `url(#${glow})` : undefined}>
          <Figure c={c} ids={ids} anim={a} />
        </g>

        {/* Aura */}
        {c.halo >= 2 && <ellipse cx={120} cy={168} rx={66} ry={96} fill="none" strokeDasharray="3 6" strokeOpacity={0.5} className={a('av-spin')} style={{ transformOrigin: '120px 168px' }} />}
        {c.halo >= 3 && <ellipse cx={120} cy={168} rx={80} ry={60} fill="none" strokeDasharray="1 5" strokeOpacity={0.4} transform="rotate(-24 120 168)" />}

        {/* Vordergrund */}
        {c.wire >= 1 && (
          <g fill="none">
            <path d="M0 266 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={`w${i}`} d={`M${8 + i * 20} 261 l4 4 m0 -4 l-4 4`} />
            ))}
          </g>
        )}
        {c.ash >= 1 &&
          Array.from({ length: [0, 12, 26, 48][c.ash] }, (_, i) => (
            <circle
              key={`a${i}`}
              cx={rnd(i, 1) * 240}
              cy={rnd(i, 2) * 240}
              r={0.6 + rnd(i, 3) * 0.9}
              fill={W}
              fillOpacity={0.55}
              stroke="none"
              className={a('av-ash')}
              style={{ animationDuration: `${6 + rnd(i, 4) * 6}s`, animationDelay: `${-rnd(i, 5) * 10}s` }}
            />
          ))}
        {c.wind >= 1 &&
          [40, 90, 150, 200].map((y, i) => (
            <line key={`wi${i}`} x1={10 + i * 30} y1={y} x2={60 + i * 30} y2={y - 8} strokeOpacity={0.35} className={a('av-wind')} style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        {c.glitch >= 1 && (
          <g fill={W} stroke="none" className={a('av-glitch')}>
            {Array.from({ length: c.glitch * 4 }, (_, i) => (
              <rect key={`g${i}`} x={rnd(i, 7) * 160} y={20 + rnd(i, 8) * 230} width={20 + rnd(i, 9) * 60} height={1 + rnd(i, 10) * 2} fillOpacity={0.25} />
            ))}
          </g>
        )}
      </g>
    </svg>
  )
}

function Drone({ x, y, beam, cls }: { x: number; y: number; beam: boolean; cls?: string }) {
  return (
    <g className={cls}>
      {beam && <polygon points={`${x - 3},${y + 4} ${x + 3},${y + 4} ${x + 26},${GROUND} ${x - 22},${GROUND}`} fill={W} fillOpacity={0.07} stroke="none" />}
      <line x1={x - 10} y1={y - 5} x2={x - 2} y2={y - 5} />
      <line x1={x + 2} y1={y - 5} x2={x + 10} y2={y - 5} />
      <line x1={x - 6} y1={y - 5} x2={x - 5} y2={y - 1} />
      <line x1={x + 6} y1={y - 5} x2={x + 5} y2={y - 1} />
      <ellipse cx={x} cy={y + 1} rx={8} ry={3.5} />
      <circle cx={x} cy={y + 2} r={1.2} fill={W} stroke="none" />
    </g>
  )
}

type P = readonly [number, number]
type Anim = (cls: string) => string | undefined
interface Ids {
  glow: string
  tone: string
}

const f1 = (n: number) => Math.round(n * 10) / 10

const normal = (a: P, b: P): P => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy) || 1
  return [-dy / l, dx / l]
}

/** Gerades, sich verjüngendes Glied von a nach b */
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

/** Querlinie über ein Glied (Bandagen, Wickel) */
const across = (a: P, b: P, t: number, w: number) => {
  const [x, y] = lerp(a, b, t)
  const [nx, ny] = normal(a, b)
  return `M${f1(x + nx * w)} ${f1(y + ny * w + 0.8)} L${f1(x - nx * w)} ${f1(y - ny * w - 0.8)}`
}

const angle = (a: P, b: P) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI

/** Haare relativ zum Kopfmittelpunkt: stachelig, Pony fällt über die Stirn */
const HAIR_FULL: P[] = [
  [-15, 5], [-23, -2], [-17, -6], [-27, -15], [-15, -16], [-19, -29], [-6, -21], [0, -34], [6, -22], [18, -30],
  [14, -16], [26, -14], [17, -6], [22, 2], [15, 5],
  [12, -6], [8, 0], [4, -7], [-1, 1], [-4, -7], [-9, 0], [-12, -6],
]
const HAIR_HELMET: P[] = [
  [-16, -6], [0, -9], [16, -6], [18, 9], [14, 5],
  [12, -6], [8, 0], [4, -7], [-1, 1], [-4, -7], [-9, 0], [-12, -6],
  [-14, 5], [-18, 9],
]
const BANGS: P[] = [
  [-14, -9], [-6, -14], [6, -14], [14, -9], [15, 5], [12, -6], [8, 0], [4, -7], [-1, 1], [-4, -7], [-9, 0], [-12, -6], [-15, 5],
]
const shape = (pts: P[], hx: number, hy: number) => 'M' + pts.map(([x, y]) => `${hx + x} ${hy + y}`).join(' L') + ' Z'

function Eye({ x, y, side, mode, ids, anim }: { x: number; y: number; side: -1 | 1; mode: 'open' | 'tired' | 'glow'; ids: Ids; anim: Anim }) {
  if (mode === 'tired') {
    return (
      <g>
        <path d={`M${x - 2.8} ${y + 0.6} A2.8 3 0 0 0 ${x + 2.8} ${y + 0.6} Z`} strokeWidth={0.9} />
        <circle cx={x} cy={y + 2} r={1.1} fill={W} stroke="none" />
        <path d={`M${x - side * 4} ${y + 0.4} Q${x} ${y - 0.8} ${x + side * 4.6} ${y + 0.8}`} fill="none" strokeWidth={1.9} />
        <path d={`M${x - 3.6} ${y - 2.6} L${x + 3.6} ${y - 2.2}`} fill="none" strokeWidth={0.8} strokeOpacity={0.7} />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx={x} cy={y + 0.8} rx={2.8} ry={3.4} strokeWidth={0.9} />
      <ellipse
        cx={x}
        cy={y + 1.2}
        rx={1.6}
        ry={2.1}
        fill={W}
        stroke="none"
        filter={mode === 'glow' ? `url(#${ids.glow})` : undefined}
        className={mode === 'glow' ? anim('av-pulse') : undefined}
      />
      <circle cx={x + 0.8} cy={y} r={0.75} fill={B} stroke="none" />
      <path d={`M${x - side * 4.2} ${y - 1.6} Q${x + side * 0.4} ${y - 4.8} ${x + side * 4.9} ${y - 1} l${side * 1.3} 0.9`} fill="none" strokeWidth={1.9} />
      <path d={`M${x - side * 1.6} ${y + 5} L${x + side * 2.6} ${y + 4.4}`} fill="none" strokeWidth={0.8} strokeOpacity={0.7} />
    </g>
  )
}

function MechArm({ a, b, c, flip }: { a: P; b: P; c: P; flip?: boolean }) {
  const [nx, ny] = normal(b, c)
  const s = flip ? -1 : 1
  return (
    <g>
      <path d={limb(a, b, 4.8, 4)} />
      <path d={limb(b, c, 4, 3.2)} />
      <line x1={f1(b[0] + nx * 1.5 * s)} y1={f1(b[1] + ny * 1.5 * s)} x2={f1(c[0] + nx * 1.2 * s)} y2={f1(c[1] + ny * 1.2 * s)} strokeWidth={0.8} strokeOpacity={0.7} />
      <circle cx={a[0]} cy={a[1]} r={4.6} />
      <circle cx={a[0]} cy={a[1]} r={1.4} fill={W} stroke="none" />
      <circle cx={b[0]} cy={b[1]} r={3.8} />
      <circle cx={b[0]} cy={b[1]} r={1.1} fill={W} stroke="none" />
      <g transform={`rotate(${f1(angle(b, c) - 90)} ${c[0]} ${c[1]})`}>
        <path d={`M${c[0] - 3.5} ${c[1]} l-1 6 l2 2 M${c[0]} ${c[1] + 1} l0 7 M${c[0] + 3.5} ${c[1]} l1 6 l-2 2`} fill="none" />
        <rect x={c[0] - 4} y={c[1] - 2} width={8} height={4} rx={1} />
      </g>
    </g>
  )
}

/** Die Figur selbst (Anime-Linienstil) – wird auch für die Schatten-Echos wiederverwendet */
function Figure({ c, ids, anim }: { c: AvatarCounts; ids: Ids; anim: Anim }) {
  const hunched = c.posture === 0
  const victory = c.posture >= 2
  const hx = 120
  const hy = hunched ? 97 : 94
  const sY = hunched ? 121 : 118
  const scars = 3 - c.scar
  const helmet = c.headwear >= 2
  const hood = c.headwear === 1

  const shL: P = [103, sY + 3]
  const shR: P = [137, sY + 3]
  const elL: P = victory ? [92, sY - 14] : [98, sY + 29]
  const haL: P = victory ? [88, sY - 37] : [96, sY + 55]
  const armed = c.weapon >= 1
  const elR: P = armed ? [149, sY + 27] : [142, sY + 29]
  const haR: P = armed ? [158, sY + 45] : [144, sY + 55]
  const hipL: P = [113, 180]
  const knL: P = [110, 214]
  const anL: P = [108, 245]
  const hipR: P = [127, 180]
  const knR: P = [131, 214]
  const anR: P = [134, 245]
  const WX = 159
  const weaponTop = c.weapon >= 2 ? 104 : 112

  const shoe = (x: number, dir: number) => `M${x - dir * 5} 250 L${x - dir * 6} 243 L${x + dir * 3} 242 L${x + dir * 9} 247 L${x + dir * 9} 250 Z`
  const hand = (el: P, ha: P) => {
    const [x, y] = lerp(el, ha, 1.09)
    return <ellipse cx={f1(x)} cy={f1(y)} rx={3.4} ry={4} transform={`rotate(${f1(angle(el, ha) - 90)} ${f1(x)} ${f1(y)})`} />
  }
  const coatPath =
    c.coat >= 3
      ? `M102 ${sY + 1} C 84 ${sY + 40}, 62 196, 36 236 L 52 231 L 60 243 L 76 234 L 90 246 L 104 236 L 120 206 L 132 244 L 146 234 L 154 240 C 152 200, 146 150, 138 ${sY + 1} Z`
      : c.coat >= 2
        ? `M102 ${sY + 1} L88 232 L94 240 L99 233 L104 242 L110 235 L120 206 L130 235 L136 242 L141 233 L146 240 L152 232 L138 ${sY + 1} Z`
        : `M102 ${sY + 1} L90 238 L110 242 L120 206 L130 242 L150 238 L138 ${sY + 1} Z`

  return (
    <g>
      {/* Mantel (hinten) */}
      {c.coat >= 1 && (
        <g className={c.coat >= 3 ? anim('av-flutter') : undefined} style={{ transformOrigin: `120px ${sY}px` }}>
          <path d={coatPath} />
          <path d={coatPath} fill={`url(#${ids.tone})`} stroke="none" />
        </g>
      )}

      {/* Schal-Enden wehen nach hinten */}
      {c.mouth >= 1 && (
        <g className={anim('av-scarf')} style={{ transformOrigin: `${hx - 8}px ${hy + 24}px` }}>
          <path d={`M${hx - 8} ${hy + 22} C${hx - 22} ${hy + 10} ${hx - 40} ${hy + 38} ${hx - 62} ${hy + 24} L${hx - 56} ${hy + 30} L${hx - 61} ${hy + 35} C${hx - 40} ${hy + 46} ${hx - 26} ${hy + 22} ${hx - 8} ${hy + 29} Z`} />
          <path d={`M${hx - 8} ${hy + 26} C${hx - 20} ${hy + 34} ${hx - 30} ${hy + 54} ${hx - 48} ${hy + 50} L${hx - 43} ${hy + 55} L${hx - 47} ${hy + 59} C${hx - 28} ${hy + 60} ${hx - 20} ${hy + 40} ${hx - 6} ${hy + 31} Z`} />
          <path d={`M${hx - 8} ${hy + 26} C${hx - 20} ${hy + 34} ${hx - 30} ${hy + 54} ${hx - 48} ${hy + 50} L${hx - 43} ${hy + 55} L${hx - 47} ${hy + 59} C${hx - 28} ${hy + 60} ${hx - 20} ${hy + 40} ${hx - 6} ${hy + 31} Z`} fill={`url(#${ids.tone})`} stroke="none" />
        </g>
      )}

      {/* Rucksack */}
      {c.backpack >= 2 && (
        <g>
          <line x1={141} y1={sY + 4} x2={150} y2={sY - 56} />
          <line x1={146} y1={sY - 30} x2={152} y2={sY - 33} strokeOpacity={0.7} />
          <circle cx={150} cy={sY - 58} r={1.8} fill={W} stroke="none" className={anim('av-blink')} />
        </g>
      )}
      {c.backpack >= 3 && (
        <g>
          <line x1={92} y1={sY - 4} x2={99} y2={sY + 6} />
          <path d={`M80 ${sY - 10} Q86 ${sY + 6} 101 ${sY - 2} Z`} />
          <line x1={90} y1={sY - 4} x2={84} y2={sY - 14} strokeOpacity={0.7} />
        </g>
      )}
      {c.backpack >= 1 && <rect x={96} y={sY + 3} width={48} height={46} rx={5} />}
      {c.backpack >= 4 &&
        [101, 139].map((x) => (
          <g key={x}>
            <path d={`M${x - 4} ${sY + 49} L${x + 4} ${sY + 49} L${x + 6} ${sY + 57} L${x - 6} ${sY + 57} Z`} />
            <path d={`M${x - 3} ${sY + 59} L${x} ${sY + 72} L${x + 3} ${sY + 59}`} fill="none" className={anim('av-flicker')} />
          </g>
        ))}

      {/* Beine & Schuhe */}
      <path d={bent(hipL, knL, anL, 7.5, 5.6, 4.3)} />
      <path d={bent(hipR, knR, anR, 7.5, 5.6, 4.3)} />
      <path d={bent(hipR, knR, anR, 3.2, 2.4, 1.8)} transform="translate(3 0)" fill={`url(#${ids.tone})`} stroke="none" />
      <path d={`M${knL[0] - 1} ${knL[1] - 2} l3 2.5 M${knR[0]} ${knR[1] - 2} l-3 2.5`} fill="none" strokeWidth={0.8} strokeOpacity={0.7} />
      {scars >= 2 && <path d={`${across(hipL, knL, 0.45, 7)} ${across(hipL, knL, 0.6, 6.6)}`} fill="none" strokeWidth={1.1} />}
      {c.legs >= 1 && (
        <g>
          <path d={`M${anL[0] - 5.6} 226 L${anL[0] + 5.6} 226 L${anL[0] + 5.2} 243 L${anL[0] - 5.2} 243 Z`} />
          <path d={`M${anR[0] - 5.6} 226 L${anR[0] + 5.6} 226 L${anR[0] + 5.2} 243 L${anR[0] - 5.2} 243 Z`} />
          <path d={`M${anL[0] - 5.6} 229 L${anL[0] + 5.6} 229 M${anR[0] - 5.6} 229 L${anR[0] + 5.6} 229`} fill="none" strokeWidth={0.8} />
        </g>
      )}
      <path d={shoe(anL[0], -1)} />
      <path d={shoe(anR[0], 1)} />
      {c.legs >= 2 && (
        <g>
          <path d={`M${knL[0] - 6} ${knL[1] - 4} Q${knL[0]} ${knL[1] - 8} ${knL[0] + 6} ${knL[1] - 4} L${knL[0] + 5} ${knL[1] + 5} L${knL[0] - 5} ${knL[1] + 5} Z`} />
          <path d={`M${knR[0] - 6} ${knR[1] - 4} Q${knR[0]} ${knR[1] - 8} ${knR[0] + 6} ${knR[1] - 4} L${knR[0] + 5} ${knR[1] + 5} L${knR[0] - 5} ${knR[1] + 5} Z`} />
        </g>
      )}
      {c.legs >= 3 && (
        <g fill="none" strokeWidth={0.9}>
          {[0.35, 0.5, 0.65].map((t) => (
            <path key={t} d={`${across(knL, anL, t, 4.6)} ${across(knR, anR, t, 4.6)}`} />
          ))}
        </g>
      )}

      {/* Hüfte, Hals, Oberkörper */}
      <path d="M107 175 L133 175 L135 185 L105 185 Z" />
      <path d={`M${hx - 4} ${hy + 12} L${hx + 4} ${hy + 12} L${hx + 4.5} ${sY + 3} L${hx - 4.5} ${sY + 3} Z`} />
      <path d={`M102 ${sY + 1} Q120 ${sY - 2} 138 ${sY + 1} L133 176 L107 176 Z`} strokeWidth={1.5} />
      <path d={`M128 ${sY + 2} L137.5 ${sY + 2} L132.8 175 L126 175 Z`} fill={`url(#${ids.tone})`} stroke="none" />
      <path d={`M111 ${sY} L120 ${sY + 11} L129 ${sY}`} fill="none" strokeWidth={1} />
      <line x1={120} y1={sY + 12} x2={120} y2={175} strokeWidth={0.8} strokeOpacity={0.7} />
      {c.coat >= 1 && <path d={`M104 ${sY + 3} L108 176 L101 232 M136 ${sY + 3} L132 176 L139 232`} fill="none" />}
      {c.backpack >= 1 && c.chest < 1 && <path d={`M106 ${sY + 2} L109 ${sY + 38} M134 ${sY + 2} L131 ${sY + 38}`} fill="none" strokeWidth={2.2} />}
      {scars >= 3 && <path d="M105 150 l4 -3 l1 5 l4 -4" fill="none" strokeWidth={0.9} />}

      {/* Brust */}
      {c.chest >= 1 && <path d={`M104 ${sY + 3} L132 174 M136 ${sY + 3} L108 174`} fill="none" strokeWidth={1.6} strokeOpacity={0.9} />}
      {c.chest >= 2 && (
        <g>
          <path d={`M107 ${sY + 12} L133 ${sY + 12} L131 158 L120 162 L109 158 Z`} />
          <path d={`M120 ${sY + 12} L120 162`} strokeWidth={0.7} strokeOpacity={0.6} />
          {[111, 129].map((x) => (
            <circle key={x} cx={x} cy={sY + 16} r={0.9} fill={W} stroke="none" />
          ))}
        </g>
      )}
      {c.chest >= 3 && (
        <g filter={`url(#${ids.glow})`}>
          <circle cx={120} cy={sY + 28} r={6.5} />
          <circle cx={120} cy={sY + 28} r={2.8} fill={W} className={anim('av-pulse')} />
        </g>
      )}

      {/* Gürtel */}
      {c.belt >= 1 && (
        <g>
          <rect x={105.5} y={173} width={29} height={5} />
          <rect x={117} y={172} width={6} height={7} />
        </g>
      )}
      {c.belt >= 2 && (
        <g>
          <rect x={106} y={179} width={7} height={8} rx={1} />
          <rect x={127} y={179} width={7} height={8} rx={1} />
        </g>
      )}
      {c.belt >= 3 && (
        <g>
          <line x1={106} y1={178} x2={103} y2={188} />
          <rect x={98.5} y={188} width={9} height={11} rx={2} />
          <circle cx={103} cy={193.5} r={2} fill={W} stroke="none" filter={`url(#${ids.glow})`} className={anim('av-pulse')} />
        </g>
      )}

      {/* Waffe */}
      {c.weapon >= 1 && (
        <g>
          <rect x={WX - 2} y={weaponTop} width={4} height={GROUND - weaponTop} />
          {Array.from({ length: c.tally }, (_, i) => (
            <line key={`k${i}`} x1={WX + 2} y1={190 + i * 4} x2={WX + 6} y2={190 + i * 4} />
          ))}
          {c.weapon >= 2 && c.weapon < 4 && <path d={`M${WX - 3.5} 106 L${WX} 80 L${WX + 3.5} 106 Z`} />}
          {c.weapon >= 3 && <path d={`M${WX - 2} 116 l5 3 l-5 3 l5 3 l-5 3 l5 3 l-5 3 l5 3`} fill="none" />}
          {c.weapon >= 4 && (
            <g filter={`url(#${ids.glow})`}>
              <circle cx={WX} cy={96} r={6.5} fill={W} className={anim('av-pulse')} />
              {Array.from({ length: 8 }, (_, i) => {
                const ang = (i / 8) * Math.PI * 2
                return <line key={i} x1={f1(WX + Math.cos(ang) * 9.5)} y1={f1(96 + Math.sin(ang) * 9.5)} x2={f1(WX + Math.cos(ang) * 14)} y2={f1(96 + Math.sin(ang) * 14)} />
              })}
            </g>
          )}
        </g>
      )}

      {/* Arme */}
      {c.arms >= 4 ? (
        <MechArm a={shL} b={elL} c={haL} flip />
      ) : (
        <g>
          <path d={bent(shL, elL, haL, 5.4, 4.2, 3.3)} />
          {hand(elL, haL)}
          {c.arms >= 1 && <path d={[0.25, 0.45, 0.65].map((t) => across(elL, haL, t, 4)).join(' ')} fill="none" strokeWidth={1} />}
          {c.wrist >= 1 && (
            <g transform={`rotate(${f1(angle(elL, haL) - 90)} ${f1(lerp(elL, haL, 0.82)[0])} ${f1(lerp(elL, haL, 0.82)[1])})`}>
              <rect x={f1(lerp(elL, haL, 0.82)[0] - 4.5)} y={f1(lerp(elL, haL, 0.82)[1] - 2.8)} width={9} height={5.6} rx={1} />
              <line
                x1={f1(lerp(elL, haL, 0.82)[0] - 2.5)}
                y1={f1(lerp(elL, haL, 0.82)[1])}
                x2={f1(lerp(elL, haL, 0.82)[0] + 2.5)}
                y2={f1(lerp(elL, haL, 0.82)[1])}
                strokeWidth={0.8}
                className={anim('av-blink')}
              />
            </g>
          )}
        </g>
      )}
      {c.arms >= 3 ? (
        <MechArm a={shR} b={elR} c={haR} />
      ) : (
        <g>
          <path d={bent(shR, elR, haR, 5.4, 4.2, 3.3)} />
          <path d={bent(shR, elR, haR, 2.2, 1.6, 1.2)} transform="translate(2 0)" fill={`url(#${ids.tone})`} stroke="none" />
          {hand(elR, haR)}
          {c.arms >= 2 && <path d={`M141 ${sY + 6} Q152 ${sY + 14} ${elR[0]} ${elR[1]} T${haR[0] - 2} ${haR[1] - 2}`} fill="none" strokeWidth={1.1} />}
        </g>
      )}

      {/* Schulterplatten */}
      {c.shoulders >= 1 && <path d={`M95 ${sY + 15} Q93 ${sY - 3} 109 ${sY - 2} L110 ${sY + 5} Q101 ${sY + 4} 99 ${sY + 16} Z`} />}
      {c.shoulders >= 2 && <path d={`M145 ${sY + 15} Q147 ${sY - 3} 131 ${sY - 2} L130 ${sY + 5} Q139 ${sY + 4} 141 ${sY + 16} Z`} />}
      {c.shoulders >= 3 && (
        <g>
          <path d={`M97 ${sY + 1} l-6 -7 l9 3 Z M103 ${sY - 2} l-2 -9 l6 6 Z`} />
          <path d={`M143 ${sY + 1} l6 -7 l-9 3 Z M137 ${sY - 2} l2 -9 l-6 6 Z`} />
        </g>
      )}

      {/* Schal um den Hals */}
      {c.mouth >= 1 && <path d={`M${hx - 11} ${hy + 17} Q${hx} ${hy + 23} ${hx + 11} ${hy + 17} L${hx + 13} ${hy + 25} Q${hx} ${hy + 31} ${hx - 13} ${hy + 25} Z`} />}

      {/* Kopf */}
      <g transform={hunched ? `rotate(9 ${hx} ${hy + 16})` : undefined}>
        {hood && <path d={`M${hx - 19} ${hy + 16} Q${hx - 26} ${hy - 28} ${hx} ${hy - 29} Q${hx + 26} ${hy - 28} ${hx + 19} ${hy + 16} L${hx + 23} ${sY + 5} L${hx - 23} ${sY + 5} Z`} />}
        <path
          d={`M${hx - 14} ${hy} C${hx - 14} ${hy - 19} ${hx + 14} ${hy - 19} ${hx + 14} ${hy} L${hx + 12} ${hy + 8} Q${hx + 9} ${hy + 14} ${hx} ${hy + 18} Q${hx - 9} ${hy + 14} ${hx - 12} ${hy + 8} Z`}
          strokeWidth={1.5}
        />

        {/* Nase, Mund oder Maske */}
        {c.mouth < 2 && (
          <g fill="none" strokeWidth={0.9}>
            <path d={`M${hx + 1} ${hy + 9} l1.2 2.4 l-1.6 0.3`} />
            <path
              d={
                victory
                  ? `M${hx - 3} ${hy + 13.4} Q${hx} ${hy + 15.6} ${hx + 3.4} ${hy + 12.8}`
                  : hunched
                    ? `M${hx - 2} ${hy + 14.4} L${hx + 2} ${hy + 14.4}`
                    : `M${hx - 2.6} ${hy + 14} L${hx + 2.2} ${hy + 13.6}`
              }
            />
          </g>
        )}
        {c.mouth >= 2 && (
          <g>
            <path d={`M${hx - 12.3} ${hy + 9.5} Q${hx} ${hy + 8} ${hx + 12.3} ${hy + 9.5} L${hx + 10} ${hy + 15} Q${hx} ${hy + 22} ${hx - 10} ${hy + 15} Z`} />
            <path d={`M${hx - 9} ${hy + 12} l3 1.5 M${hx - 9} ${hy + 14.5} l3 1 M${hx + 9} ${hy + 12} l-3 1.5 M${hx + 9} ${hy + 14.5} l-3 1`} fill="none" strokeWidth={0.8} />
            <circle cx={hx} cy={hy + 15} r={3} />
            <path d={`M${hx - 1.7} ${hy + 15} L${hx + 1.7} ${hy + 15} M${hx} ${hy + 13.3} L${hx} ${hy + 16.7}`} strokeWidth={0.8} />
          </g>
        )}
        {c.mouth >= 3 && (
          <g>
            <rect x={hx - 20} y={hy + 9} width={6} height={9} rx={2} transform={`rotate(-22 ${hx - 17} ${hy + 13})`} />
            <rect x={hx + 14} y={hy + 9} width={6} height={9} rx={2} transform={`rotate(22 ${hx + 17} ${hy + 13})`} />
          </g>
        )}
        {/* Haare */}
        <g className={anim('av-sway')} style={{ transformOrigin: `${hx}px ${hy}px` }}>
          {hood ? (
            <path d={shape(BANGS, hx, hy)} strokeWidth={1.3} />
          ) : (
            <>
              <path d={shape(helmet ? HAIR_HELMET : HAIR_FULL, hx, hy)} strokeWidth={1.6} />
              {!helmet && (
                <path
                  d={`M${hx - 7} ${hy - 17} L${hx - 3} ${hy - 7} M${hx + 6} ${hy - 17} L${hx + 4} ${hy - 8} M${hx - 15} ${hy - 11} L${hx - 10} ${hy - 4} M${hx + 14} ${hy - 11} L${hx + 11} ${hy - 4}`}
                  fill="none"
                  strokeWidth={0.8}
                  strokeOpacity={0.7}
                />
              )}
            </>
          )}
        </g>
        {hood && (
          <path
            d={`M${hx - 17} ${hy + 12} Q${hx - 21} ${hy - 22} ${hx} ${hy - 23} Q${hx + 21} ${hy - 22} ${hx + 17} ${hy + 12} L${hx + 14} ${hy + 10} Q${hx + 16} ${hy - 17} ${hx} ${hy - 18} Q${hx - 16} ${hy - 17} ${hx - 14} ${hy + 10} Z`}
          />
        )}

        {/* Helm, Kamm, Antennen */}
        {helmet && (
          <g>
            <path d={`M${hx - 18} ${hy - 2} C${hx - 20} ${hy - 31} ${hx + 20} ${hy - 31} ${hx + 18} ${hy - 2} Z`} strokeWidth={1.5} />
            <path d={`M${hx - 15} ${hy - 9} Q${hx} ${hy - 13} ${hx + 15} ${hy - 9}`} fill="none" strokeWidth={0.8} strokeOpacity={0.7} />
            <path d={`M${hx + 3} ${hy - 18} L${hx + 13} ${hy - 19} L${hx + 15} ${hy - 9}`} fill={`url(#${ids.tone})`} strokeWidth={0.6} />
          </g>
        )}
        {c.headwear >= 3 && <path d={`M${hx - 3} ${hy - 23} L${hx + 4} ${hy - 38} L${hx + 13} ${hy - 20} Z`} />}
        {c.headwear >= 4 &&
          [-1, 1].flatMap((d) =>
            [
              [11, 19, 40],
              [5, 9, 44],
            ].map(([x0, x1, y1], i) => (
              <g key={`${d}${i}`}>
                <line x1={hx + d * x0} y1={hy - 20} x2={hx + d * x1} y2={hy - y1} />
                <circle cx={hx + d * x1} cy={hy - y1 - 1.5} r={1.5} fill={W} stroke="none" className={anim('av-blink')} style={{ animationDelay: `${i * 0.4 + (d + 1) * 0.3}s` }} />
              </g>
            )),
          )}

        {/* Schutzbrille, hochgeschoben auf den Kopf */}
        {c.eyes >= 1 && (
          <g transform={`rotate(-14 ${hx} ${hy - 17})`}>
            <path d={`M${hx - 17} ${hy - 12} Q${hx} ${hy - 22} ${hx + 17} ${hy - 12}`} fill="none" strokeWidth={2.4} />
            <rect x={hx - 11} y={hy - 21.5} width={22} height={8} rx={3.8} strokeWidth={1.4} />
            <ellipse cx={hx - 5.2} cy={hy - 17.5} rx={3.6} ry={2.7} />
            <ellipse cx={hx + 5.2} cy={hy - 17.5} rx={3.6} ry={2.7} />
            <path d={`M${hx - 7.2} ${hy - 18.6} l2 -1 M${hx + 3.2} ${hy - 18.6} l2 -1`} strokeWidth={0.8} />
            {c.eyes >= 2 && (
              <g>
                <circle cx={hx - 5.2} cy={hy - 17.5} r={1.3} fill={W} stroke="none" />
                <circle cx={hx + 5.2} cy={hy - 17.5} r={1.3} fill={W} stroke="none" />
                <rect x={hx + 11} y={hy - 20} width={4} height={5} rx={1} />
              </g>
            )}
          </g>
        )}
        {/* Augen */}
        {c.eyes < 4 && (
          <g className={hunched ? undefined : anim('av-eyes')} style={{ transformOrigin: `${hx}px ${hy + 5}px` }}>
            <Eye x={hx - 6.5} y={hy + 4} side={-1} mode={hunched ? 'tired' : 'open'} ids={ids} anim={anim} />
            <Eye x={hx + 6.5} y={hy + 4} side={1} mode={hunched ? 'tired' : c.eyes >= 3 ? 'glow' : 'open'} ids={ids} anim={anim} />
          </g>
        )}
        {c.eyes === 3 && (
          <path d={`M${hx + 11} ${hy + 4} q9 -1 18 3`} fill="none" strokeWidth={1.4} filter={`url(#${ids.glow})`} className={anim('av-pulse')} />
        )}

        {scars >= 1 && (
          <g transform={`rotate(-18 ${hx - 10} ${hy + 10})`}>
            <rect x={hx - 13} y={hy + 8.6} width={7} height={2.8} rx={0.8} strokeWidth={0.9} />
            <path d={`M${hx - 11} ${hy + 8.6} l0 2.8 M${hx - 8} ${hy + 8.6} l0 2.8`} strokeWidth={0.6} />
          </g>
        )}

        {c.eyes >= 4 && (
          <g filter={`url(#${ids.glow})`}>
            <path d={`M${hx - 15} ${hy + 0.5} L${hx + 15} ${hy + 0.5} L${hx + 14} ${hy + 8} L${hx - 14} ${hy + 8} Z`} strokeWidth={1.4} />
            <rect x={hx - 11} y={hy + 3.4} width={22} height={2.2} fill={W} stroke="none" className={anim('av-pulse')} />
          </g>
        )}

        {/* Aura-Ring */}
        {c.halo >= 1 && <ellipse cx={hx} cy={hy - 46} rx={18} ry={4.5} fill="none" filter={`url(#${ids.glow})`} />}
      </g>
    </g>
  )
}
