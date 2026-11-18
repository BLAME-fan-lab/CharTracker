import { Backpack, Hammer, Recycle, X } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from '../../../components/Sheet'
import { IconButton } from '../../../components/ui'
import { settingsRepo } from '../../../data'
import type { CombatProgress } from '../../../data/types'
import {
  CAP_CRIT,
  CAP_ELEM,
  CAP_STAT,
  computeBonus,
  equippedTalismans,
  formatBoost,
  MAX_TALISMAN_LEVEL,
  RARITY_INFO,
  scrapTalisman,
  scrapValue,
  SLOTS,
  STAT_INFO,
  toggleEquip,
  upgradeCost,
  upgradeTalisman,
  type ElemBoost,
  type Inventory,
  type Rarity,
} from '../../../domain/loot'
import { cx } from '../../../lib/cx'
import { StatGrid } from './CombatBook'
import { TalismanIcon } from './TalismanIcon'
import type { CombatData } from './useCombat'

const RARITY_ORDER: Record<Rarity, number> = { legendary: 0, epic: 1, rare: 2, common: 3 }

function save(progress: CombatProgress, inv: Inventory) {
  return settingsRepo.updateSettings({ combat: { ...progress, loot: inv } })
}

/** Beutel: Vorräte, Talisman-Plätze, Schmiede */
export function Bag({ data, onClose }: { data: CombatData; onClose: () => void }) {
  const inv = data.inventory
  const [confirm, setConfirm] = useState<string | null>(null)
  const equipped = equippedTalismans(inv)
  const bonus = computeBonus(inv)
  const sorted = [...inv.talismans].sort(
    (a, b) => (b.relic ?? 0) - (a.relic ?? 0) || RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || b.value + b.level - (a.value + a.level),
  )
  const update = (next: Inventory) => {
    if (next !== inv) void save(data.progress, next)
  }

  const active: [string, string, string][] = []
  for (const k of ['atk', 'mag', 'hp', 'def', 'spd', 'mana'] as const) if (bonus[k] > 0) active.push([STAT_INFO[k].label, `+${bonus[k]} %`, STAT_INFO[k].color])
  if (bonus.crit > 0) active.push(['Krit', `+${bonus.crit} %-Pkt.`, STAT_INFO.crit.color])
  for (const [k, v] of Object.entries(bonus.elem) as [ElemBoost, number][]) if (v > 0) active.push([STAT_INFO[k].label, `+${v} %`, STAT_INFO[k].color])

  return (
    <Sheet
      label="Beutel"
      onClose={onClose}
      header={
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-mono text-sm tracking-[0.2em] uppercase">
            <Backpack className="size-4" /> Beutel
          </h2>
          <IconButton label="Schließen" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </div>
      }
    >
      <div className="space-y-4 font-mono">
        <StatGrid
          items={[
            ['Splitter', inv.shards],
            ['Heiltränke', inv.heal],
            ['Manatränke', inv.mana],
          ]}
        />

        <section>
          <h3 className="mb-2 text-[11px] tracking-[0.2em] text-zinc-400 uppercase">
            Ausgerüstet · {equipped.length}/{SLOTS}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: SLOTS }, (_, i) => {
              const t = equipped[i]
              return t ? (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update(toggleEquip(inv, t.id))}
                  className="flex flex-col items-center gap-1 rounded-xl border border-zinc-700 bg-black p-2 text-center"
                  style={{ boxShadow: `0 0 14px ${STAT_INFO[t.stat].color}55` }}
                  title="Ablegen"
                >
                  <TalismanIcon t={t} />
                  <span className="w-full truncate text-[10px] text-zinc-200">{t.name}</span>
                  <span className="text-[10px]" style={{ color: STAT_INFO[t.stat].color }}>
                    {formatBoost(t).replace(/ %.*/, ' %')}
                  </span>
                </button>
              ) : (
                <div key={`empty${i}`} className="grid min-h-24 place-items-center rounded-xl border border-dashed border-zinc-800 text-[10px] text-zinc-600">
                  frei
                </div>
              )
            })}
          </div>
          {active.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              {active.map(([label, v, color]) => (
                <li key={label} style={{ color }}>
                  {label} {v}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-1 text-[10px] text-zinc-500">
            Obergrenzen: Werte +{CAP_STAT} %, Krit +{CAP_CRIT} Punkte, Elemente +{CAP_ELEM} %. Ausgerüstete Talismane leuchten an deinem Helden.
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-[11px] tracking-[0.2em] text-zinc-400 uppercase">Talismane · {inv.talismans.length}</h3>
          {sorted.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-black p-3 text-xs text-zinc-400">Noch keine Beute. Gewinne Kämpfe im Turm.</p>
          ) : (
            <ul className="space-y-2">
              {sorted.map((t) => {
                const on = inv.equipped.includes(t.id)
                const cost = upgradeCost(t)
                const maxed = t.level >= MAX_TALISMAN_LEVEL
                return (
                  <li key={t.id} className={cx('rounded-xl border bg-black p-2.5', on ? 'border-zinc-500' : 'border-zinc-800')}>
                    <div className="flex items-center gap-2.5">
                      <TalismanIcon t={t} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="truncate text-sm text-zinc-100">{t.name}</span>
                          <span className="text-[10px] text-zinc-500 uppercase">{t.relic ? 'Relikt' : RARITY_INFO[t.rarity].label}</span>
                        </div>
                        <div className="text-[11px]" style={{ color: STAT_INFO[t.stat].color }}>
                          {formatBoost(t)}
                          <span className="ml-2 text-zinc-500">
                            Stufe {t.level}/{MAX_TALISMAN_LEVEL}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => update(toggleEquip(inv, t.id))}
                        disabled={!on && inv.equipped.length >= SLOTS}
                        className={cx('rounded-md px-2 py-1', on ? 'bg-zinc-100 text-black' : 'border border-zinc-700 text-zinc-200 hover:border-zinc-400', 'disabled:opacity-40')}
                      >
                        {on ? 'Ablegen' : 'Anlegen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => update(upgradeTalisman(inv, t.id))}
                        disabled={maxed || inv.shards < cost}
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-zinc-200 hover:border-zinc-400 disabled:opacity-40"
                      >
                        <Hammer className="size-3" /> {maxed ? 'Maximal' : `Schmieden · ${cost}`}
                      </button>
                      {!t.relic &&
                        (confirm === t.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              update(scrapTalisman(inv, t.id))
                              setConfirm(null)
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-1 text-rose-200"
                          >
                            <Recycle className="size-3" /> Wirklich? +{scrapValue(t)}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirm(t.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-1 text-zinc-400 hover:border-zinc-500"
                          >
                            <Recycle className="size-3" /> Zerlegen · +{scrapValue(t)}
                          </button>
                        ))}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Beute gibt es bei jedem Sieg: Seelensplitter immer, manchmal Tränke oder Talismane. Bosse lassen ein eigenes Relikt fallen. Tränke aus dem
          Beutel trinkt dein Held im Kampf automatisch, wenn er sie braucht.
        </p>
      </div>
    </Sheet>
  )
}
