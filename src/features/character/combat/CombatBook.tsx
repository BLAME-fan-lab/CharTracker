import { BookOpen, Lock, Swords } from 'lucide-react'
import { Sheet } from '../../../components/Sheet'
import { IconButton } from '../../../components/ui'
import { X } from 'lucide-react'
import { SKILL_NAMES } from '../../../domain/characterSheet'
import {
  ELEMENT_LABEL,
  equippedSpells,
  SPELLS,
  spellElement,
  spellName,
  TECHNIQUES,
  type HeroStats,
  type Spell,
  type Technique,
} from '../../../domain/combat'
import { cx } from '../../../lib/cx'
import type { CombatData } from './useCombat'

type Req = Spell['req'] | Technique['req']
const reqText = (r: Req) => (r.skill === 'level' ? `Charakterlevel ${r.min}` : `${SKILL_NAMES[r.skill]} ${r.min}`)
const reqMet = (r: Req, d: CombatData) => (r.skill === 'level' ? d.level : d.skills[r.skill]) >= r.min

function spellEffect(sp: Spell, st: HeroStats) {
  switch (sp.kind) {
    case 'damage':
      return `${Math.round(st.mag * sp.power)} Schaden`
    case 'drain':
      return `${Math.round(st.mag * sp.power)} Schaden + Heilung`
    case 'heal':
      return `+${Math.round(st.hp * sp.power)} LP`
    case 'regen':
      return `3 × ${Math.round(st.hp * sp.power)} LP`
    case 'shield':
      return '−50 % Schaden'
    case 'haste':
      return 'Doppelzug'
  }
}

function techEffect(t: Technique, st: HeroStats) {
  if (t.kind === 'counter') return '60 % zurück'
  const per = Math.round(st.atk * t.power)
  return t.hits > 1 ? `${t.hits} × ${per} Schaden` : `${per} Schaden${t.kind === 'pierce' ? ', durchdringend' : ''}`
}

export function StatGrid({ items }: { items: [string, string | number][] }) {
  return (
    <dl className="grid grid-cols-3 gap-2 font-mono text-xs sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-zinc-800 bg-black px-2 py-1.5">
          <dt className="text-[10px] tracking-wider text-zinc-500 uppercase">{k}</dt>
          <dd className="tabular-nums text-zinc-100">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Entry({ open, title, meta, effect, desc, req, badge }: { open: boolean; title: string; meta: string; effect: string; desc: string; req: string; badge?: string }) {
  return (
    <li className={cx('rounded-xl border p-3 font-mono', open ? 'border-zinc-700 bg-black' : 'border-zinc-900 bg-zinc-950')}>
      {open ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-zinc-100">{title}</span>
            <span className="text-[11px] tabular-nums text-zinc-300">{effect}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500">
            <span>{meta}</span>
            {badge && <span className="rounded bg-zinc-100 px-1 text-[10px] text-black uppercase">{badge}</span>}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">{desc}</p>
        </>
      ) : (
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <Lock className="size-3.5 shrink-0" />
          <span>???</span>
          <span className="ml-auto text-[11px]">ab {req}</span>
        </div>
      )}
    </li>
  )
}

/** Zauberbuch (Grimoire) und Kampftechniken (Schwert) */
export function CombatBook({ kind, data, onClose }: { kind: 'zauber' | 'technik'; data: CombatData; onClose: () => void }) {
  const st = data.hero.stats
  const path = data.hero.path
  const isSpells = kind === 'zauber'
  const equipped = new Set(equippedSpells(data.skills, data.level, st.slots).map((s) => s.id))
  const title = isSpells ? 'Zauberbuch' : 'Kampftechniken'

  return (
    <Sheet
      label={title}
      onClose={onClose}
      header={
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-mono text-sm tracking-[0.2em] uppercase">
            {isSpells ? <BookOpen className="size-4" /> : <Swords className="size-4" />}
            {title}
          </h2>
          <IconButton label="Schließen" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </div>
      }
    >
      <div className="space-y-4">
        {isSpells ? (
          <StatGrid
            items={[
              ['Magie', st.mag],
              ['Mana', st.mana],
              ['Plätze', st.slots],
            ]}
          />
        ) : (
          <StatGrid
            items={[
              ['Angriff', st.atk],
              ['Ausdauer', st.stamina],
              ['Krit', `${Math.round(st.crit * 100)} %`],
            ]}
          />
        )}
        <ul className="space-y-2">
          {isSpells
            ? SPELLS.map((sp) => {
                const open = reqMet(sp.req, data)
                return (
                  <Entry
                    key={sp.id}
                    open={open}
                    title={spellName(sp, path)}
                    meta={`${ELEMENT_LABEL[spellElement(sp, path)]} · ${sp.cost} Mana`}
                    effect={spellEffect(sp, st)}
                    desc={sp.desc}
                    req={reqText(sp.req)}
                    badge={equipped.has(sp.id) ? 'Ausgerüstet' : undefined}
                  />
                )
              })
            : TECHNIQUES.map((t) => (
                <Entry
                  key={t.id}
                  open={reqMet(t.req, data)}
                  title={t.name}
                  meta={t.cost ? `${t.cost} Ausdauer` : 'kostenlos'}
                  effect={techEffect(t, st)}
                  desc={t.desc}
                  req={reqText(t.req)}
                />
              ))}
        </ul>
        <p className="font-mono text-[10px] leading-relaxed text-zinc-500">
          {isSpells
            ? 'Zauber werden durch Uni, Lesen, Musik und Gesundheit freigeschaltet. Mit mehr Lesen bekommst du mehr Zauberplätze. Vor jedem Kampf rüstet dein Held die Zauber aus, die gegen den Gegner am besten wirken.'
            : 'Techniken werden durch Sport freigeschaltet. Mehr Training heißt mehr Angriff und Ausdauer, mit Hygiene & Pflege steigt die Chance auf kritische Treffer.'}
        </p>
      </div>
    </Sheet>
  )
}
