import { useId } from 'react'
import type { AvatarCounts } from '../../domain/avatar'

/*
 * Dystopischer Avatar: ein Wanderer in einer endlosen Megastruktur.
 * Nur weiße Linien auf Schwarz, Schatten als Strichschraffur.
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

const LIGHTS: P[] = [
  [88, 92],
  [152, 100],
  [100, 70],
  [140, 66],
  [76, 132],
]
/** Wächter-Silhouetten auf fernen Vorsprüngen */
const WATCHERS: P[] = [
  [52, 150],
  [82, 190],
  [200, 150],
  [42, 110],
  [184, 150],
]

export function Avatar({ c, className, animate = true }: { c: AvatarCounts; className?: string; animate?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const ids: Ids = { glow: `glow-${uid}`, tone: `tone-${uid}` }
  const a = (cls: string) => (animate ? cls : undefined)

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
        {/* Strichschraffur für Schatten */}
        <pattern id={ids.tone} width={3} height={3} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1={0.5} y1={0} x2={0.5} y2={3} stroke={W} strokeWidth={0.55} strokeOpacity={0.6} />
        </pattern>
      </defs>
      <rect width="240" height="280" fill={B} />

      <g stroke={W} fill={B} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        {/* Lichtschächte von oben */}
        {c.searchlight >= 1 && (
          <polygon points="74,40 88,40 132,250 62,250" fill={W} fillOpacity={0.07} stroke="none" className={a('av-shaft')} />
        )}
        {c.searchlight >= 2 && (
          <polygon points="150,40 160,40 186,250 138,250" fill={W} fillOpacity={0.07} stroke="none" className={a('av-shaft')} style={{ animationDelay: '-3s' }} />
        )}

        <Megastructure n={c.building} ids={ids} />

        {/* Ferne Lichter in der Tiefe */}
        {LIGHTS.slice(0, c.star).map(([x, y], i) => (
          <g key={`l${i}`} className={a('av-twinkle')} style={{ animationDelay: `${i * 0.7}s` }}>
            <circle cx={x} cy={y} r={1.1} fill={W} stroke="none" />
            <path d={`M${x - 3.5} ${y} L${x + 3.5} ${y} M${x} ${y - 3.5} L${x} ${y + 3.5}`} strokeWidth={0.6} strokeOpacity={0.7} />
          </g>
        ))}

        {/* Gigantische Schleuse in der rechten Wand */}
        {c.moon >= 1 && (
          <g>
            <circle cx={228} cy={112} r={27} strokeWidth={1.6} />
            <circle cx={228} cy={112} r={20} />
            <path d="M228 112 m-20 0 a20 20 0 0 0 40 0 Z" fill={`url(#${ids.tone})`} stroke="none" />
            {Array.from({ length: 12 }, (_, i) => {
              const ang = (i / 12) * Math.PI * 2
              return <line key={i} x1={f1(228 + Math.cos(ang) * 20)} y1={f1(112 + Math.sin(ang) * 20)} x2={f1(228 + Math.cos(ang) * 27)} y2={f1(112 + Math.sin(ang) * 27)} strokeWidth={0.9} />
            })}
            {[0, 1, 2, 3].map((i) => {
              const ang = (i / 4) * Math.PI * 2 + 0.4
              return <line key={`sp${i}`} x1={f1(228 + Math.cos(ang) * 6)} y1={f1(112 + Math.sin(ang) * 6)} x2={f1(228 + Math.cos(ang) * 20)} y2={f1(112 + Math.sin(ang) * 20)} />
            })}
            <circle cx={228} cy={112} r={6} />
            {c.moon >= 2 && (
              <g>
                <path d="M203 98 L208 103 L206 109 L213 112 L210 119" fill="none" strokeWidth={1.6} />
                <path d="M201 120 L209 117 L214 124 L208 133 L201 131 Z" />
                <path d="M203 124 l6 3 M204 129 l4 -2" strokeWidth={0.7} />
              </g>
            )}
          </g>
        )}

        {/* Aufzugsschacht */}
        {c.tower >= 1 && (
          <g>
            <path d="M168 40 L168 250 M180 40 L180 250" fill="none" />
            {[40, 70, 100, 130, 160, 190, 220].map((y) => (
              <path key={y} d={`M168 ${y} L180 ${y + 30} M180 ${y} L168 ${y + 30}`} strokeWidth={0.6} strokeOpacity={0.5} fill="none" />
            ))}
            <g className={a('av-lift')}>
              <rect x={169.5} y={200} width={9} height={14} />
              <line x1={174} y1={40} x2={174} y2={200} strokeWidth={0.6} strokeOpacity={0.6} />
              <circle cx={174} cy={205} r={1} fill={W} stroke="none" className={a('av-blink')} />
            </g>
          </g>
        )}

        {/* Altes Terminal */}
        {c.monolith >= 1 && (
          <g>
            <path d="M210 250 L210 204 L232 198 L232 250 Z" />
            <rect x={213} y={205} width={16} height={14} />
            <path d="M215 209 l8 0 M215 212 l11 0 M215 215 l5 0" strokeWidth={0.7} />
            <rect x={221} y={214} width={2.5} height={2.5} fill={W} stroke="none" className={a('av-blink')} />
            <path d="M213 226 L229 226 M213 230 L229 230" strokeWidth={0.6} strokeOpacity={0.6} />
          </g>
        )}

        {/* Warnzeichen an der Wand */}
        {c.banner >= 1 && (
          <g>
            <path d="M17 126 L30 150 L4 150 Z" strokeWidth={1.5} />
            <path d="M17 134 L17 143" strokeWidth={1.8} />
            <circle cx={17} cy={146.5} r={0.9} fill={W} stroke="none" />
          </g>
        )}

        {/* Wächter */}
        {WATCHERS.slice(0, c.crow).map(([x, y], i) => (
          <Watcher key={`w${i}`} x={x} y={y} cls={a('av-blink')} delay={i * 0.6} />
        ))}

        {/* Laufsteg */}
        <rect x={0} y={GROUND} width={240} height={30} fill={`url(#${ids.tone})`} stroke="none" opacity={0.45} />
        <line x1={0} y1={GROUND} x2={240} y2={GROUND} strokeWidth={1.5} />
        <line x1={0} y1={GROUND + 6} x2={240} y2={GROUND + 6} strokeOpacity={0.6} />
        {Array.from({ length: 30 }, (_, i) => (
          <line key={`gr${i}`} x1={4 + i * 8} y1={GROUND} x2={7 + i * 8} y2={GROUND + 6} strokeWidth={0.7} strokeOpacity={0.5} />
        ))}
        {c.trail >= 1 &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <ellipse key={`t${i}`} cx={20 + i * 14} cy={264 - (i % 2) * 4} rx={3} ry={1.6} strokeOpacity={0.6} />
          ))}

        {/* Drohnen */}
        {c.drone >= 1 && <Drone x={194} y={70} beam={c.drone >= 2} cls={a('av-bob')} />}
        {c.drone >= 3 && <Drone x={62} y={96} beam={false} cls={a('av-bob-slow')} />}

        {/* Konzentrationslinien hinter der Lichtgestalt */}
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

        <g filter={c.apex >= 1 ? `url(#${ids.glow})` : undefined}>
          <Figure c={c} ids={ids} anim={a} />
        </g>

        {/* Aura */}
        {c.halo >= 2 && <ellipse cx={120} cy={168} rx={66} ry={96} fill="none" strokeDasharray="3 6" strokeOpacity={0.5} className={a('av-spin')} style={{ transformOrigin: '120px 168px' }} />}
        {c.halo >= 3 && <ellipse cx={120} cy={168} rx={80} ry={60} fill="none" strokeDasharray="1 5" strokeOpacity={0.4} transform="rotate(-24 120 168)" />}

        {/* Vordergrund */}
        {c.wire >= 1 && (
          <g fill="none">
            <path d="M0 268 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={`w${i}`} d={`M${8 + i * 20} 263 l4 4 m0 -4 l-4 4`} />
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

/**
 * Die endlose Megastruktur: 11 Ausbaustufen, von hinten nach vorne gezeichnet.
 * n = Anzahl freigeschalteter Teile.
 */
function Megastructure({ n, ids }: { n: number; ids: Ids }) {
  const hatch = `url(#${ids.tone})`
  const panels = [18, 46, 74, 102, 130, 158, 186, 214, 242]
  return (
    <g>
      {/* 10: ferne Fassaden */}
      {n >= 10 && (
        <g opacity={0.35}>
          {[
            [44, 64, 46, 72],
            [150, 64, 46, 72],
          ].map(([x0, y0, w, h], k) => (
            <g key={k}>
              <rect x={x0} y={y0} width={w} height={h} strokeWidth={0.7} />
              {Array.from({ length: 11 }, (_, r) =>
                Array.from({ length: 7 }, (_, q) =>
                  rnd(k * 50 + r, q) > 0.45 ? <rect key={`${r}-${q}`} x={x0 + 3 + q * 6} y={y0 + 3 + r * 6} width={1.6} height={1.6} fill={W} stroke="none" /> : null,
                ),
              )}
            </g>
          ))}
        </g>
      )}
      {/* 8: tiefer Schacht (Flucht nach hinten) */}
      {n >= 8 && (
        <g opacity={0.4} fill="none" strokeWidth={0.8}>
          <path d="M34 0 L96 84 M206 0 L144 84 M34 250 L96 176 M206 250 L144 176" />
          <rect x={96} y={84} width={48} height={92} />
          <rect x={106} y={104} width={28} height={52} />
          <rect x={113} y={118} width={14} height={24} />
        </g>
      )}
      {/* 5: ferne Brücke */}
      {n >= 5 && (
        <g opacity={0.55} fill="none">
          <path d="M34 150 L206 150 M34 154 L206 154 M34 142 L206 142" />
          {Array.from({ length: 15 }, (_, i) => (
            <line key={i} x1={40 + i * 12} y1={142} x2={40 + i * 12} y2={150} strokeWidth={0.7} />
          ))}
          <path d="M34 168 L54 154 M206 168 L186 154" strokeWidth={0.8} />
        </g>
      )}
      {/* 4: hängende Kabel */}
      {n >= 4 && (
        <g fill="none">
          <path d="M34 64 Q120 150 206 58" strokeWidth={1.8} />
          <path d="M34 86 Q110 172 206 96" strokeWidth={1.1} />
        </g>
      )}
      {/* 9: zweites Rohr */}
      {n >= 9 && (
        <g>
          <rect x={34} y={46} width={172} height={8} />
          {[52, 92, 132, 172].map((x) => (
            <rect key={x} x={x} y={44} width={4} height={12} />
          ))}
        </g>
      )}
      {/* 3: riesiges Rohr */}
      {n >= 3 && (
        <g>
          <rect x={34} y={22} width={172} height={16} strokeWidth={1.5} />
          <rect x={34} y={32} width={172} height={6} fill={hatch} stroke="none" />
          {[60, 100, 140, 180].map((x) => (
            <g key={x}>
              <rect x={x} y={19} width={6} height={22} />
              <circle cx={x + 3} cy={22} r={0.7} fill={W} stroke="none" />
              <circle cx={x + 3} cy={38} r={0.7} fill={W} stroke="none" />
            </g>
          ))}
        </g>
      )}
      {/* 7: Kabelstränge */}
      {n >= 7 && (
        <g fill="none">
          <path d="M186 38 C184 90 190 140 186 196 q-3 8 2 12" />
          <path d="M192 38 C194 100 189 150 193 212 q2 6 -3 9" strokeWidth={1.8} />
          <path d="M197 38 C199 80 196 120 199 168 q3 6 -1 10" strokeWidth={0.9} />
        </g>
      )}
      {/* 1: linke Wand */}
      {n >= 1 && (
        <g>
          <rect x={-2} y={-2} width={36} height={254} strokeWidth={1.6} />
          <rect x={26} y={0} width={8} height={250} fill={hatch} stroke="none" />
          {panels.map((y, i) => (
            <g key={y}>
              <line x1={0} y1={y} x2={34} y2={y} strokeWidth={0.8} />
              <line x1={i % 2 ? 12 : 20} y1={y - 28} x2={i % 2 ? 12 : 20} y2={y} strokeWidth={0.6} strokeOpacity={0.6} />
              <circle cx={4} cy={y - 4} r={0.7} fill={W} stroke="none" />
            </g>
          ))}
          <path d="M34 110 L48 110 M38 110 L34 118" fill="none" />
        </g>
      )}
      {/* 11: Durchbruch in der linken Wand */}
      {n >= 11 && (
        <g>
          <path d="M3 62 L14 56 L27 65 L31 80 L25 95 L29 104 L12 111 L5 98 L1 84 Z" />
          <path d="M3 62 L14 56 L27 65 L31 80 L25 95 L29 104 L12 111 L5 98 L1 84 Z" fill={hatch} stroke="none" opacity={0.6} />
          <path d="M2 72 L30 77 M1 90 L28 93 M14 56 L12 111" fill="none" strokeWidth={0.9} />
        </g>
      )}
      {/* 2: rechte Wand */}
      {n >= 2 && (
        <g>
          <rect x={206} y={-2} width={36} height={254} strokeWidth={1.6} />
          <rect x={206} y={0} width={8} height={250} fill={hatch} stroke="none" />
          {panels.map((y, i) => (
            <g key={y}>
              <line x1={206} y1={y} x2={240} y2={y} strokeWidth={0.8} />
              <line x1={i % 2 ? 222 : 230} y1={y - 28} x2={i % 2 ? 222 : 230} y2={y} strokeWidth={0.6} strokeOpacity={0.6} />
              <circle cx={236} cy={y - 4} r={0.7} fill={W} stroke="none" />
            </g>
          ))}
        </g>
      )}
      {/* 6: Treppe ins Nichts */}
      {n >= 6 && (
        <g>
          <path
            d={`M34 250 ${Array.from({ length: 8 }, (_, i) => `L${34 + i * 6} ${244 - i * 6} L${40 + i * 6} ${244 - i * 6}`).join(' ')} L82 202 Z`}
          />
          <path d="M34 232 L82 184" fill="none" strokeWidth={0.9} />
          {[0, 2, 4, 6, 8].map((i) => (
            <line key={i} x1={34 + i * 6} y1={232 - i * 6} x2={34 + i * 6} y2={244 - i * 6} strokeWidth={0.7} />
          ))}
        </g>
      )}
    </g>
  )
}

function Watcher({ x, y, cls, delay }: { x: number; y: number; cls?: string; delay: number }) {
  return (
    <g opacity={0.8}>
      <path d={`M${x - 7} ${y} L${x + 7} ${y}`} fill="none" />
      <path d={`M${x - 2.2} ${y - 17} L${x + 2.2} ${y - 17} L${x + 1.4} ${y - 9} L${x - 1.4} ${y - 9} Z`} strokeWidth={0.9} />
      <path d={`M${x - 1} ${y - 9} L${x - 1.8} ${y} M${x + 1} ${y - 9} L${x + 1.8} ${y} M${x - 2.2} ${y - 16} L${x - 3.2} ${y - 5} M${x + 2.2} ${y - 16} L${x + 3.2} ${y - 5}`} fill="none" strokeWidth={0.9} />
      <ellipse cx={x} cy={y - 20.5} rx={1.9} ry={2.8} strokeWidth={0.9} />
      <circle cx={x + 0.5} cy={y - 21} r={0.7} fill={W} stroke="none" className={cls} style={{ animationDelay: `${delay}s` }} />
    </g>
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

/** Haare relativ zum Kopfmittelpunkt: zottelig, Strähnen hängen ins Gesicht */
const BANG_EDGE: P[] = [
  [12, -3], [10, 3], [7, -4], [5, 5], [2, -4], [-1, 8], [-3, -3], [-7, 4], [-9, -4], [-12, 3],
]
const HAIR_FULL: P[] = [
  [-15, 13], [-17, 3], [-20, -5], [-17, -15], [-10, -22], [-1, -24], [8, -23], [15, -18], [19, -9], [19, 2], [16, 12],
  [13, 3], ...BANG_EDGE, [-13, 7],
]
const HAIR_HELMET: P[] = [[-16, -6], [0, -9], [16, -6], [17, 11], [13, 3], ...BANG_EDGE, [-13, 7], [-16, 12]]
const BANGS: P[] = [[-13, -9], [-6, -13], [6, -13], [13, -9], [15, 9], [13, 3], ...BANG_EDGE, [-13, 7], [-15, 10]]
const shape = (pts: P[], hx: number, hy: number) => 'M' + pts.map(([x, y]) => `${hx + x} ${hy + y}`).join(' L') + ' Z'

function Eye({ x, y, side, mode, ids, anim }: { x: number; y: number; side: -1 | 1; mode: 'open' | 'tired' | 'glow'; ids: Ids; anim: Anim }) {
  if (mode === 'tired') {
    return (
      <g>
        <path d={`M${x - 1.5} ${y + 0.4} A1.5 1.5 0 0 0 ${x + 1.5} ${y + 0.4} Z`} fill={W} stroke="none" />
        <path d={`M${x - side * 3.8} ${y + 0.3} L${x + side * 4.4} ${y - 0.3}`} fill="none" strokeWidth={1.7} />
        <path d={`M${x - side * 2.4} ${y + 2.2} L${x + side * 3.2} ${y + 1.8}`} fill="none" strokeWidth={0.7} strokeOpacity={0.7} />
      </g>
    )
  }
  return (
    <g>
      <circle
        cx={x + side * 0.3}
        cy={y + 0.3}
        r={mode === 'glow' ? 1.9 : 1.5}
        fill={W}
        stroke="none"
        filter={mode === 'glow' ? `url(#${ids.glow})` : undefined}
        className={mode === 'glow' ? anim('av-pulse') : undefined}
      />
      {mode !== 'glow' && <circle cx={x + side * 0.3} cy={y + 0.3} r={0.55} fill={B} stroke="none" />}
      <path d={`M${x - side * 3.8} ${y - 0.8} L${x + side * 4.7} ${y - 2.3} l${side * 0.8} 0.9`} fill="none" strokeWidth={1.8} />
      <path d={`M${x - side * 2.4} ${y + 2.1} L${x + side * 3.4} ${y + 1.4}`} fill="none" strokeWidth={0.7} strokeOpacity={0.8} />
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

      {/* Hoher Kragen */}
      <path d={`M${hx - 13} ${sY + 3} L${hx - 11.5} ${hy + 10} L${hx - 5} ${hy + 14} L${hx - 4.5} ${sY + 1} Z`} />
      <path d={`M${hx + 13} ${sY + 3} L${hx + 11.5} ${hy + 10} L${hx + 5} ${hy + 14} L${hx + 4.5} ${sY + 1} Z`} />
      <path d={`M${hx + 12.5} ${sY + 2} L${hx + 11.5} ${hy + 11} L${hx + 8} ${hy + 13} L${hx + 8} ${sY + 1} Z`} fill={`url(#${ids.tone})`} stroke="none" />

      {/* Schal um den Hals */}
      {c.mouth >= 1 && <path d={`M${hx - 11} ${hy + 17} Q${hx} ${hy + 23} ${hx + 11} ${hy + 17} L${hx + 13} ${hy + 25} Q${hx} ${hy + 31} ${hx - 13} ${hy + 25} Z`} />}

      {/* Kopf */}
      <g transform={hunched ? `rotate(9 ${hx} ${hy + 16})` : undefined}>
        {hood && <path d={`M${hx - 19} ${hy + 16} Q${hx - 26} ${hy - 28} ${hx} ${hy - 29} Q${hx + 26} ${hy - 28} ${hx + 19} ${hy + 16} L${hx + 23} ${sY + 5} L${hx - 23} ${sY + 5} Z`} />}
        <path
          d={`M${hx - 12.5} ${hy - 1} C${hx - 13} ${hy - 18} ${hx + 13} ${hy - 18} ${hx + 12.5} ${hy - 1} L${hx + 11} ${hy + 9} Q${hx + 7} ${hy + 15.5} ${hx} ${hy + 18} Q${hx - 7} ${hy + 15.5} ${hx - 11} ${hy + 9} Z`}
          strokeWidth={1.5}
        />
        <path d={`M${hx + 8.5} ${hy + 4} L${hx + 12.3} ${hy + 1} L${hx + 11} ${hy + 9} Q${hx + 8} ${hy + 14} ${hx + 4} ${hy + 16.5} Z`} fill={`url(#${ids.tone})`} stroke="none" />

        {/* Nase, Mund oder Maske */}
        {c.mouth < 2 && (
          <g fill="none" strokeWidth={0.9}>
            <path d={`M${hx + 0.5} ${hy + 7.5} l1 3.6 l-1.6 0.4`} />
            <path
              d={
                victory
                  ? `M${hx - 3} ${hy + 13.8} L${hx + 1} ${hy + 13.8} Q${hx + 2.8} ${hy + 13.6} ${hx + 3.6} ${hy + 12.6}`
                  : `M${hx - 3} ${hy + 13.9} L${hx + 2.5} ${hy + 13.6}`
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
                <>
                  <path d={shape(HAIR_FULL, hx, hy)} fill={`url(#${ids.tone})`} stroke="none" opacity={0.7} />
                  <path
                    d={`M${hx - 8} ${hy - 19} Q${hx - 6} ${hy - 10} ${hx - 3} ${hy - 4} M${hx + 4} ${hy - 20} Q${hx + 5} ${hy - 10} ${hx + 3} ${hy - 4} M${hx - 15} ${hy - 12} Q${hx - 14} ${hy - 2} ${hx - 14} ${hy + 8} M${hx + 15} ${hy - 12} Q${hx + 16} ${hy - 2} ${hx + 15} ${hy + 8}`}
                    fill="none"
                    strokeWidth={0.8}
                  />
                </>
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
