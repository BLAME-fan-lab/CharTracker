import { useId, type ReactNode } from 'react'
import type { AvatarCounts } from '../../domain/avatar'

/*
 * Dystopischer Avatar: nur weiße Linien auf Schwarz.
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
  const glow = `glow-${uid}`
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
            <circle cx={202} cy={40} r={14} />
            <circle cx={197} cy={36} r={3} strokeOpacity={0.5} />
            <circle cx={207} cy={46} r={2} strokeOpacity={0.5} />
            {c.moon >= 2 && <path d="M193 29 l6 8 l-4 6 l8 6 l-2 7" fill="none" />}
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

        {/* Strahlen hinter der Lichtgestalt */}
        {c.apex >= 1 &&
          Array.from({ length: 14 }, (_, i) => {
            const ang = (i / 14) * Math.PI * 2 + 0.2
            return (
              <line
                key={`ray${i}`}
                x1={120 + Math.cos(ang) * 72}
                y1={165 + Math.sin(ang) * 96}
                x2={120 + Math.cos(ang) * 112}
                y2={165 + Math.sin(ang) * 140}
                strokeOpacity={0.18}
                strokeDasharray="2 4"
              />
            )
          })}

        {/* Echos */}
        {c.echo >= 1 && (
          <g opacity={0.18} transform="translate(-18 0)">
            <Figure c={c} glow={glow} anim={a} />
          </g>
        )}
        {c.echo >= 2 && (
          <g opacity={0.12} transform="translate(18 0)">
            <Figure c={c} glow={glow} anim={a} />
          </g>
        )}

        <g filter={c.apex >= 1 ? `url(#${glow})` : undefined}>
          <Figure c={c} glow={glow} anim={a} />
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

/** Die Figur selbst – wird auch für die Schatten-Echos wiederverwendet */
function Figure({ c, glow, anim }: { c: AvatarCounts; glow: string; anim: (cls: string) => string | undefined }) {
  const hunched = c.posture === 0
  const hx = hunched ? 123 : 120
  const hy = hunched ? 86 : 80
  const sY = hunched ? 110 : 104
  const victory = c.posture >= 2
  const scars = 3 - c.scar

  return (
    <g>
      {/* Mantel / Umhang hinter dem Körper */}
      {c.coat >= 3 ? (
        <path
          d={`M94 ${sY + 2} C 78 ${sY + 50}, 56 196, 36 240 L 52 234 L 62 246 L 80 236 L 94 248 L 110 238 L 128 248 L 142 236 L 152 244 C 151 200, 150 150, 146 ${sY + 2} Z`}
          className={anim('av-flutter')}
          style={{ transformOrigin: `120px ${sY}px` }}
        />
      ) : c.coat >= 1 ? (
        <path
          d={
            c.coat >= 2
              ? `M92 ${sY + 4} L86 232 L94 238 L100 230 L108 238 L116 230 L124 238 L132 230 L140 238 L148 230 L154 236 L148 ${sY + 4} Z`
              : `M92 ${sY + 4} L86 236 L154 236 L148 ${sY + 4} Z`
          }
        />
      ) : null}

      {/* Rucksack */}
      {c.backpack >= 1 && (
        <g>
          <rect x={88} y={sY + 4} width={64} height={46} rx={4} />
          {c.backpack >= 4 &&
            [96, 144].map((x) => (
              <g key={x}>
                <path d={`M${x - 4} ${sY + 50} L${x + 4} ${sY + 50} L${x + 6} ${sY + 58} L${x - 6} ${sY + 58} Z`} />
                <path d={`M${x - 3} ${sY + 60} L${x} ${sY + 72} L${x + 3} ${sY + 60}`} fill="none" className={anim('av-flicker')} />
              </g>
            ))}
        </g>
      )}
      {c.backpack >= 2 && (
        <g>
          <line x1={148} y1={sY + 6} x2={160} y2={sY - 44} />
          <circle cx={160} cy={sY - 46} r={2} fill={W} stroke="none" className={anim('av-blink')} />
        </g>
      )}
      {c.backpack >= 3 && <path d={`M86 ${sY - 2} q-6 -14 8 -18 q-2 10 -8 18 Z M86 ${sY - 2} L92 ${sY + 6}`} />}

      {/* Kapuze (hinter dem Kopf) */}
      {c.headwear === 1 && (
        <path d={`M${hx - 19} ${hy + 12} Q${hx - 23} ${hy - 22} ${hx} ${hy - 24} Q${hx + 23} ${hy - 22} ${hx + 19} ${hy + 12} L${hx + 26} ${sY + 4} L${hx - 26} ${sY + 4} Z`} />
      )}
      {c.headwear >= 2 && <path d={`M${hx - 20} ${sY + 2} Q${hx} ${sY - 12} ${hx + 20} ${sY + 2}`} />}

      {/* Beine */}
      <path d="M100 180 L116 180 L114 250 L103 250 Z" />
      <path d="M124 180 L140 180 L137 250 L126 250 Z" />
      {c.legs >= 1 && (
        <g>
          <path d="M101 234 L116 234 L118 250 L98 250 Z" />
          <path d="M124 234 L139 234 L142 250 L122 250 Z" />
          <line x1={99} y1={246} x2={117} y2={246} />
          <line x1={123} y1={246} x2={141} y2={246} />
        </g>
      )}
      {c.legs >= 2 && (
        <g>
          <rect x={102} y={204} width={13} height={9} rx={3} />
          <rect x={126} y={204} width={13} height={9} rx={3} />
        </g>
      )}
      {c.legs >= 3 && (
        <g fill="none">
          <path d="M103 218 L115 218 M103 224 L115 224 M103 230 L115 230" />
          <path d="M126 218 L138 218 M126 224 L138 224 M126 230 L138 230" />
        </g>
      )}

      {/* Oberkörper */}
      <path d={`M94 ${sY} L146 ${sY} L142 180 L98 180 Z`} />
      {c.backpack >= 1 && <path d={`M101 ${sY + 1} L104 ${sY + 36} M139 ${sY + 1} L136 ${sY + 36}`} fill="none" strokeWidth={2.2} />}
      {c.chest >= 1 && <path d={`M96 ${sY + 2} L140 178 M144 ${sY + 2} L100 178`} fill="none" strokeOpacity={0.8} />}
      {c.chest >= 2 && (
        <g>
          <path d={`M102 ${sY + 12} L138 ${sY + 12} L135 160 L105 160 Z`} />
          {[106, 134].map((x) => (
            <circle key={x} cx={x} cy={sY + 17} r={0.9} fill={W} stroke="none" />
          ))}
        </g>
      )}
      {c.chest >= 3 && (
        <g filter={`url(#${glow})`}>
          <circle cx={120} cy={sY + 32} r={7} />
          <circle cx={120} cy={sY + 32} r={3} fill={W} className={anim('av-pulse')} />
        </g>
      )}

      {/* Gürtel */}
      {c.belt >= 1 && (
        <g>
          <rect x={97} y={175} width={46} height={6} />
          <rect x={116} y={174} width={8} height={8} />
        </g>
      )}
      {c.belt >= 2 && (
        <g>
          <rect x={101} y={181} width={8} height={9} rx={1} />
          <rect x={131} y={181} width={8} height={9} rx={1} />
        </g>
      )}
      {c.belt >= 3 && (
        <g>
          <line x1={99} y1={181} x2={96} y2={190} />
          <rect x={91} y={190} width={9} height={11} rx={2} />
          <circle cx={95.5} cy={195.5} r={2} fill={W} stroke="none" filter={`url(#${glow})`} className={anim('av-pulse')} />
        </g>
      )}

      {/* Waffe / Werkzeug */}
      {c.weapon >= 1 && (
        <g>
          <rect x={155} y={c.weapon >= 2 ? 104 : 112} width={4} height={GROUND - (c.weapon >= 2 ? 104 : 112)} />
          {Array.from({ length: c.tally }, (_, i) => (
            <line key={`k${i}`} x1={159} y1={198 + i * 4} x2={163} y2={198 + i * 4} />
          ))}
          {c.weapon >= 2 && c.weapon < 4 && <path d="M152 106 L157 84 L162 106 Z" />}
          {c.weapon >= 3 && <path d="M153 116 l8 4 l-8 4 l8 4 l-8 4 l8 4 l-8 4 l8 4" fill="none" />}
          {c.weapon >= 4 && (
            <g filter={`url(#${glow})`}>
              <circle cx={157} cy={96} r={7} fill={W} className={anim('av-pulse')} />
              {Array.from({ length: 8 }, (_, i) => {
                const ang = (i / 8) * Math.PI * 2
                return <line key={i} x1={157 + Math.cos(ang) * 10} y1={96 + Math.sin(ang) * 10} x2={157 + Math.cos(ang) * 15} y2={96 + Math.sin(ang) * 15} />
              })}
            </g>
          )}
        </g>
      )}

      {/* Arme */}
      {victory ? (
        <g>
          <path d={`M94 ${sY} L101 ${sY + 7} L84 ${sY - 36} L76 ${sY - 32} Z`} />
          <circle cx={79} cy={sY - 37} r={4.5} />
        </g>
      ) : c.arms >= 4 ? (
        <MechArm side="left" sY={sY} />
      ) : (
        <g>
          <path d={`M93 ${sY + 1} L101 ${sY + 8} L94 168 L84 165 Z`} />
          <circle cx={88} cy={170} r={4.5} />
        </g>
      )}
      {c.arms >= 3 ? (
        <MechArm side="right" sY={sY} />
      ) : (
        <g>
          <path d={`M147 ${sY + 1} L139 ${sY + 8} L151 160 L159 155 Z`} />
          <circle cx={157} cy={159} r={4.5} />
        </g>
      )}
      {c.arms >= 1 && !victory && c.arms < 4 && (
        <path d="M86 150 l9 3 M86 156 l9 3 M85 162 l9 3" fill="none" />
      )}
      {c.arms >= 2 && c.arms < 3 && (
        <path d={`M146 ${sY + 6} q6 10 0 18 t4 20 t2 14`} fill="none" />
      )}
      {c.wrist >= 1 && !victory && (
        <g>
          <rect x={83} y={156} width={10} height={6} rx={1} />
          <line x1={85} y1={159} x2={91} y2={159} strokeOpacity={0.7} className={anim('av-blink')} />
        </g>
      )}

      {/* Schulterplatten */}
      {c.shoulders >= 1 && <path d={`M86 ${sY + 12} Q86 ${sY - 6} 104 ${sY - 3} L103 ${sY + 6} Q93 ${sY + 2} 91 ${sY + 13} Z`} />}
      {c.shoulders >= 2 && <path d={`M154 ${sY + 12} Q154 ${sY - 6} 136 ${sY - 3} L137 ${sY + 6} Q147 ${sY + 2} 149 ${sY + 13} Z`} />}
      {c.shoulders >= 3 && (
        <g>
          <path d={`M88 ${sY - 1} l-5 -7 l8 3 Z M95 ${sY - 4} l-2 -9 l6 6 Z`} />
          <path d={`M152 ${sY - 1} l5 -7 l-8 3 Z M145 ${sY - 4} l2 -9 l-6 6 Z`} />
        </g>
      )}

      {/* Narben am Körper */}
      {scars >= 3 && <path d="M90 140 l6 -6 M91 137 l2 2 M93 135 l2 2" fill="none" />}
      {scars >= 2 && <path d={`M110 ${sY + 22} l14 10 M113 ${sY + 22} l-2 3 M118 ${sY + 26} l-2 3`} fill="none" />}

      {/* Kopf */}
      <line x1={hx} y1={hy + 16} x2={120} y2={sY} />
      <circle cx={hx} cy={hy} r={16} />
      {scars >= 1 && <path d={`M${hx + 7} ${hy - 9} l3 9 M${hx + 7} ${hy - 6} l2 -1 M${hx + 8} ${hy - 3} l2 -1`} fill="none" />}

      {/* Augen */}
      {c.eyes >= 4 ? (
        <g filter={`url(#${glow})`}>
          <rect x={hx - 14} y={hy - 6} width={28} height={7} rx={2} />
          <rect x={hx - 11} y={hy - 4} width={22} height={3} fill={W} stroke="none" className={anim('av-pulse')} />
        </g>
      ) : c.eyes >= 1 ? (
        <g>
          <line x1={hx - 16} y1={hy - 2} x2={hx + 16} y2={hy - 2} />
          <circle cx={hx - 6} cy={hy - 2} r={5} />
          <circle cx={hx + 6} cy={hy - 2} r={5} />
          {c.eyes >= 2 && (
            <g>
              <circle cx={hx - 6} cy={hy - 2} r={2.2} />
              <circle cx={hx + 6} cy={hy - 2} r={2.2} />
            </g>
          )}
          {c.eyes >= 3 && <circle cx={hx + 6} cy={hy - 2} r={2.6} fill={W} filter={`url(#${glow})`} className={anim('av-pulse')} />}
        </g>
      ) : (
        <g>
          <line x1={hx - 8} y1={hy - 2} x2={hx - 4} y2={hy - 2} />
          <line x1={hx + 4} y1={hy - 2} x2={hx + 8} y2={hy - 2} />
        </g>
      )}

      {/* Mund / Maske */}
      {c.mouth === 1 && (
        <path d={`M${hx - 15} ${hy + 4} L${hx + 15} ${hy + 4} L${hx + 13} ${hy + 13} L${hx - 13} ${hy + 13} Z M${hx + 12} ${hy + 12} l6 14 l-5 1`} />
      )}
      {c.mouth >= 2 && (
        <g>
          <path d={`M${hx - 12} ${hy + 3} Q${hx} ${hy + 1} ${hx + 12} ${hy + 3} L${hx + 8} ${hy + 15} Q${hx} ${hy + 19} ${hx - 8} ${hy + 15} Z`} />
          <circle cx={hx} cy={hy + 13} r={4.5} />
          <path d={`M${hx - 2.5} ${hy + 13} L${hx + 2.5} ${hy + 13} M${hx} ${hy + 10.5} L${hx} ${hy + 15.5}`} />
        </g>
      )}
      {c.mouth >= 3 && (
        <g>
          <rect x={hx - 21} y={hy + 8} width={7} height={10} rx={2} transform={`rotate(-20 ${hx - 17} ${hy + 13})`} />
          <rect x={hx + 14} y={hy + 8} width={7} height={10} rx={2} transform={`rotate(20 ${hx + 17} ${hy + 13})`} />
        </g>
      )}

      {/* Helm */}
      {c.headwear >= 2 && (
        <g>
          <path d={`M${hx - 17} ${hy - 3} Q${hx - 17} ${hy - 21} ${hx} ${hy - 21} Q${hx + 17} ${hy - 21} ${hx + 17} ${hy - 3} Z`} />
          <line x1={hx - 18} y1={hy - 3} x2={hx + 18} y2={hy - 3} />
        </g>
      )}
      {c.headwear >= 3 && <path d={`M${hx - 3} ${hy - 21} L${hx + 1} ${hy - 33} L${hx + 10} ${hy - 19}`} />}
      {c.headwear >= 4 &&
        [-12, -5, 5, 12].map((dx, i) => (
          <g key={dx}>
            <line x1={hx + dx} y1={hy - 18} x2={hx + dx * 1.6} y2={hy - 34 - (i % 2) * 6} />
            <circle cx={hx + dx * 1.6} cy={hy - 35 - (i % 2) * 6} r={1.5} fill={W} stroke="none" className={anim('av-blink')} style={{ animationDelay: `${i * 0.3}s` }} />
          </g>
        ))}

      {/* Aura-Ring über dem Kopf */}
      {c.halo >= 1 && <ellipse cx={hx} cy={hy - 30} rx={20} ry={5} fill="none" filter={`url(#${glow})`} />}
    </g>
  )
}

function MechArm({ side, sY }: { side: 'left' | 'right'; sY: number }) {
  const m = side === 'right' ? 1 : -1
  const sx = side === 'right' ? 147 : 93
  const ex = sx + m * 3
  const ey = sY + 30
  const hx = side === 'right' ? 157 : 86
  const hy = side === 'right' ? 159 : 168
  return (
    <g>
      <path d={`M${sx} ${sY + 1} L${sx - m * 8} ${sY + 8} L${ex - m * 4} ${ey} L${ex + m * 4} ${ey - 3} Z`} />
      <circle cx={ex} cy={ey} r={4.5} />
      <path d={`M${ex - 3} ${ey + 3} L${hx - 4} ${hy - 3} L${hx + 4} ${hy - 6} L${ex + 4} ${ey + 1} Z`} />
      <line x1={ex} y1={ey + 4} x2={hx} y2={hy - 5} strokeOpacity={0.6} />
      <path d={`M${hx - 5} ${hy - 3} l0 6 l3 2 m2 -8 l0 7 l3 1`} fill="none" />
      <circle cx={ex} cy={ey} r={1.2} fill={W} stroke="none" />
    </g>
  )
}
