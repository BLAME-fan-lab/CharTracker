import { ArrowLeft, Lock, Skull, Swords, Ticket, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Card, Spinner } from '../../../components/ui'
import { settingsRepo } from '../../../data'
import { avatarState, type AvatarPath } from '../../../domain/avatar'
import {
  ELEMENT_LABEL,
  enemyForFloor,
  simulateBattle,
  STARTER_TICKETS,
  TOWER_FLOORS,
  TRAIT_LABEL,
  type BattleResult,
  type Enemy,
} from '../../../domain/combat'
import { cx } from '../../../lib/cx'
import { useToday } from '../../../lib/useToday'
import { Avatar } from '../Avatar'
import { useAvatarPath } from '../useAvatarPath'
import { useCharacter } from '../useCharacter'
import { StatGrid } from './CombatBook'
import { EnemyFigure } from './EnemyFigure'
import { useCombat } from './useCombat'

export function TowerPage() {
  const today = useToday()
  const sheet = useCharacter(today)
  const data = useCombat(sheet)
  const path = useAvatarPath()
  const [battle, setBattle] = useState<{ result: BattleResult; enemy: Enemy } | null>(null)
  const [busy, setBusy] = useState(false)

  if (!sheet || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Turm der Prüfungen</h1>
        <Spinner />
      </div>
    )
  }

  const p = data.progress
  const complete = p.floor >= TOWER_FLOORS
  const enemy = enemyForFloor(Math.min(TOWER_FLOORS, p.floor + 1))
  const st = data.hero.stats

  const fight = async () => {
    if (busy || data.tickets <= 0 || complete) return
    setBusy(true)
    const seed = enemy.floor * 7919 + p.wins * 131 + p.losses * 17 + 1
    const result = simulateBattle(data.hero, enemy, seed)
    // Ergebnis sofort speichern – neu laden würfelt nicht neu
    await settingsRepo.updateSettings({
      combat: {
        floor: result.win ? Math.max(p.floor, enemy.floor) : p.floor,
        spent: p.spent + 1,
        wins: p.wins + (result.win ? 1 : 0),
        losses: p.losses + (result.win ? 0 : 1),
      },
    })
    setBattle({ result, enemy })
    setBusy(false)
  }

  if (battle) {
    return (
      <BattleView
        result={battle.result}
        enemy={battle.enemy}
        level={sheet.level}
        path={path}
        onDone={() => setBattle(null)}
      />
    )
  }

  const bosses = Array.from({ length: TOWER_FLOORS / 10 }, (_, i) => enemyForFloor((i + 1) * 10))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/charakter" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" aria-label="Zurück zum Charakter">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Turm der Prüfungen</h1>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-black p-3 font-mono sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="tracking-[0.2em] text-zinc-300 uppercase">
            Etage {complete ? TOWER_FLOORS : p.floor + 1}/{TOWER_FLOORS}
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Ticket className="size-3.5" />
            <span className="tabular-nums">{data.tickets}</span> Kampftickets
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden bg-zinc-900">
          <div className="h-full bg-zinc-100" style={{ width: `${(p.floor / TOWER_FLOORS) * 100}%` }} />
        </div>

        {complete ? (
          <p className="mt-4 text-sm text-zinc-200">Du hast den Turm bezwungen. Malgorath ist gefallen.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <div className="mx-auto w-full max-w-[14rem] overflow-hidden rounded-xl border border-zinc-800">
              <EnemyFigure look={enemy.look} boss={enemy.boss} className="block h-auto w-full" />
            </div>
            <div className="min-w-0 space-y-2 text-xs">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-zinc-100">{enemy.name}</span>
                  {enemy.boss && <span className="rounded bg-zinc-100 px-1.5 text-[10px] tracking-wider text-black uppercase">Boss</span>}
                </div>
                <div className="text-zinc-400">{enemy.title}</div>
              </div>
              <ul className="space-y-1 text-zinc-300">
                <li>Fähigkeit: {TRAIT_LABEL[enemy.trait]}</li>
                {enemy.weak && <li>Schwäche: {ELEMENT_LABEL[enemy.weak]}</li>}
                {enemy.resist && <li>Widersteht: {ELEMENT_LABEL[enemy.resist]}</li>}
                <li>
                  Lebenspunkte {enemy.hp} · Angriff {enemy.atk}
                </li>
                <li className="text-zinc-500">Ausgeglichen ab Charakterlevel {enemy.level}</li>
              </ul>
              <button
                type="button"
                onClick={() => void fight()}
                disabled={busy || data.tickets <= 0}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold tracking-widest text-black uppercase hover:bg-white disabled:opacity-40 sm:w-auto"
              >
                <Swords className="size-4" /> Kampf!
              </button>
              {data.tickets <= 0 && (
                <p className="text-[11px] text-zinc-400">
                  Keine Tickets mehr. Jeder perfekte Tag und jedes Training gibt dir ein neues.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <Card title="Deine Kampfwerte">
        <StatGrid
          items={[
            ['Leben', st.hp],
            ['Angriff', st.atk],
            ['Magie', st.mag],
            ['Rüstung', st.def],
            ['Tempo', st.spd],
            ['Krit', `${Math.round(st.crit * 100)} %`],
            ['Mana', st.mana],
            ['Ausdauer', st.stamina],
            ['Tränke', st.potions],
          ]}
        />
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          Deine Werte kommen aus deinen Skill-Bäumen und deiner Ausrüstung: Sport gibt Kraft und Leben, Uni und Lesen Magie, Gesundheit
          Rüstung, Musik Tempo, Hygiene kritische Treffer und Projekt Heiltränke.
        </p>
      </Card>

      <Card title="Bosse">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {bosses.map((b) => {
            const beaten = p.floor >= b.floor
            return (
              <li key={b.floor} className={cx('overflow-hidden rounded-xl border font-mono', beaten ? 'border-zinc-600' : 'border-zinc-900')}>
                {beaten ? (
                  <EnemyFigure look={b.look} boss className="block h-auto w-full" animate={false} />
                ) : (
                  <div className="grid aspect-[6/7] place-items-center bg-zinc-950 text-zinc-700">
                    <Lock className="size-5" />
                  </div>
                )}
                <div className="px-2 py-1.5 text-[11px]">
                  <div className="text-zinc-500">Etage {b.floor}</div>
                  <div className={cx('truncate', beaten ? 'text-zinc-100' : 'text-zinc-600')}>{beaten ? b.name : '???'}</div>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      <p className="px-1 text-xs leading-relaxed text-zinc-500">
        Ein Kampf kostet ein Ticket. Du startest mit {STARTER_TICKETS}, danach gibt jeder perfekte Tag und jedes Training ein weiteres. Bisher:{' '}
        {p.wins} Siege, {p.losses} Niederlagen.
      </p>
    </div>
  )
}

/** Wiedergabe eines berechneten Kampfes, Zug für Zug */
function BattleView({
  result,
  enemy,
  level,
  path,
  onDone,
}: {
  result: BattleResult
  enemy: Enemy
  level: number
  path: AvatarPath
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const last = result.events.length - 1
  const logRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (i >= last) return
    const t = window.setTimeout(() => setI((v) => Math.min(last, v + 1)), 750)
    return () => window.clearTimeout(t)
  }, [i, last])
  useEffect(() => {
    logRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' })
  }, [i])

  const ev = result.events[i]
  const finished = i >= last
  const heroHit = ev.actor === 'enemy' && ev.kind === 'hit'
  const enemyHit = ev.actor === 'hero' && (ev.kind === 'hit' || ev.kind === 'crit')

  const bar = (value: number, max: number) => (
    <div className="mt-1.5 h-1.5 overflow-hidden bg-zinc-900">
      <div className="h-full bg-zinc-100 transition-[width] duration-500" style={{ width: `${Math.max(0, (value / max) * 100)}%` }} />
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-sm tracking-[0.25em] text-zinc-300 uppercase">
        Etage {enemy.floor} · {enemy.name}
      </h1>
      <div className="grid grid-cols-2 gap-3">
        <div key={heroHit ? `h${i}` : 'h'} className={cx('overflow-hidden rounded-xl border border-zinc-800 bg-black', heroHit && 'animate-hit')}>
          <Avatar c={avatarState(level).counts} path={path} className="block h-auto w-full" />
          <div className="p-2 font-mono text-[11px]">
            <div className="flex justify-between text-zinc-300">
              <span>Du</span>
              <span className="tabular-nums">
                {ev.heroHp}/{result.heroMax}
              </span>
            </div>
            {bar(ev.heroHp, result.heroMax)}
          </div>
        </div>
        <div key={enemyHit ? `e${i}` : 'e'} className={cx('overflow-hidden rounded-xl border border-zinc-800 bg-black', enemyHit && 'animate-hit')}>
          <EnemyFigure look={enemy.look} boss={enemy.boss} className="block h-auto w-full" />
          <div className="p-2 font-mono text-[11px]">
            <div className="flex justify-between text-zinc-300">
              <span className="truncate">{enemy.name}</span>
              <span className="tabular-nums">
                {ev.enemyHp}/{result.enemyMax}
              </span>
            </div>
            {bar(ev.enemyHp, result.enemyMax)}
          </div>
        </div>
      </div>

      <ol ref={logRef} className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-zinc-800 bg-black p-3 font-mono text-xs" aria-live="polite">
        {result.events.slice(0, i + 1).map((e, k) => (
          <li
            key={k}
            className={cx(
              e.actor === 'hero' ? 'text-zinc-100' : e.actor === 'enemy' ? 'text-zinc-400' : 'text-zinc-500 italic',
              e.kind === 'crit' && 'font-bold',
              k === i && 'animate-fade',
            )}
          >
            {e.actor === 'hero' ? '› ' : e.actor === 'enemy' ? '‹ ' : ''}
            {e.text}
          </li>
        ))}
      </ol>

      {finished ? (
        <div className={cx('animate-pop rounded-2xl border p-4 text-center font-mono', result.win ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-zinc-200')}>
          <div className="flex items-center justify-center gap-2 text-lg font-bold tracking-widest uppercase">
            {result.win ? <Trophy className="size-5" /> : <Skull className="size-5" />}
            {result.win ? 'Sieg' : 'Niederlage'}
          </div>
          <p className="mt-1 text-xs">
            {result.win
              ? enemy.floor >= TOWER_FLOORS
                ? 'Der Turm ist bezwungen.'
                : `Etage ${enemy.floor} geschafft. Etage ${enemy.floor + 1} wartet.`
              : 'Werde im echten Leben stärker und versuche es erneut.'}
          </p>
          <button
            type="button"
            onClick={onDone}
            className={cx('mt-3 rounded-lg px-4 py-2 text-sm font-semibold', result.win ? 'bg-black text-white' : 'bg-zinc-100 text-black')}
          >
            Weiter
          </button>
        </div>
      ) : (
        <div className="flex justify-end">
          <button type="button" onClick={() => setI(last)} className="font-mono text-xs tracking-widest text-zinc-400 uppercase hover:text-white">
            Überspringen
          </button>
        </div>
      )}
    </div>
  )
}
