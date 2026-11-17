import { Archive, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button, Card, IconButton, Spinner, TextInput } from '../../../components/ui'
import {
  characterRepo,
  useBodyLogs,
  useExercises,
  useLiftLogs,
  useProfile,
  useRunLogs,
  type Exercise,
  type LiftLog,
  type LiftStandard,
} from '../../../data'
import {
  detrainingFactor,
  estimate1RM,
  fiveKEquivalent,
  liftLevel,
  pullupEquivalentReps,
  STANDARD_NAMES,
  STRENGTH_STANDARDS,
} from '../../../domain/character'
import { diffDays, fmt, isValidDateStr, type DateStr } from '../../../lib/dates'
import { formatClock, formatDecimal, parseClock, parseDecimal } from '../../../lib/numbers'

const STANDARD_LABEL: Record<LiftStandard, string> = {
  bench: 'Bankdrücken',
  squat: 'Kniebeuge',
  deadlift: 'Kreuzheben',
  ohp: 'Schulterdrücken',
  row: 'Rudern',
  pullup: 'Klimmzüge',
}

export function SportEditor({ today }: { today: DateStr }) {
  const exercises = useExercises()
  const logs = useLiftLogs()
  const runs = useRunLogs()
  const body = useBodyLogs()
  const profile = useProfile()
  if (!exercises || !logs || !runs || !body) return <Spinner />
  const weight = [...body].reverse().find((b) => b.weightKg != null)?.weightKg ?? null
  const sex = profile?.sex ?? 'm'

  return (
    <>
      {!weight && (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Für die Kraft-Level brauche ich dein Körpergewicht:{' '}
          <Link to="/charakter/health" className="font-medium underline underline-offset-2">
            Gewicht eintragen
          </Link>
        </p>
      )}
      <Card title="Kraft">
        <div className="space-y-3">
          {exercises
            .filter((e) => !e.archived)
            .map((e) => (
              <ExerciseBlock
                key={e.id}
                exercise={e}
                logs={logs.filter((l) => l.exerciseId === e.id)}
                today={today}
                bodyKg={weight}
                sex={sex}
              />
            ))}
          <AddExercise />
        </div>
      </Card>
      <Card title="Ausdauer (Laufen)">
        <RunSection runs={runs} today={today} />
      </Card>
    </>
  )
}

function ExerciseBlock({
  exercise: e,
  logs,
  today,
  bodyKg,
  sex,
}: {
  exercise: Exercise
  logs: LiftLog[]
  today: DateStr
  bodyKg: number | null
  sex: 'm' | 'f'
}) {
  const [date, setDate] = useState(today)
  const [kg, setKg] = useState('')
  const [reps, setReps] = useState('')
  const isPullup = e.standard === 'pullup'
  const kgVal = parseDecimal(kg) ?? (isPullup ? 0 : null)
  const repsVal = parseDecimal(reps)
  const valid = isValidDateStr(date) && kgVal != null && kgVal >= 0 && repsVal != null && repsVal >= 1 && Number.isInteger(repsVal)

  const level =
    e.standard && bodyKg
      ? liftLevel(e.standard, sex, bodyKg, logs.map((l) => ({ ageDays: diffDays(today, l.date), weightKg: l.weightKg, reps: l.reps })))
      : null
  const best = logs.reduce<{ value: number; log: LiftLog } | null>((acc, l) => {
    const value = isPullup && bodyKg ? pullupEquivalentReps(l.reps, l.weightKg, bodyKg) : estimate1RM(l.weightKg, l.reps)
    return !acc || value > acc.value ? { value, log: l } : acc
  }, null)
  const first = logs[0]
  const improvement =
    first && best && !isPullup && logs.length > 1 ? best.value / estimate1RM(first.weightKg, first.reps) - 1 : null
  const nextStandard = (() => {
    if (!e.standard || !bodyKg || !best) return null
    const thresholds = STRENGTH_STANDARDS[e.standard][sex]
    const current = isPullup ? best.value : (best.value * detrainingFactor(diffDays(today, best.log.date))) / bodyKg
    const i = thresholds.findIndex((t) => current < t)
    if (i < 0) return null
    return isPullup
      ? `Nächste Stufe „${STANDARD_NAMES[i]}“: ${thresholds[i]} Wdh.`
      : `Nächste Stufe „${STANDARD_NAMES[i]}“: ${formatDecimal(thresholds[i] * bodyKg, 0)} kg (1RM)`
  })()

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (!valid) return
    void characterRepo.addLiftLog(e.id, date, kgVal!, repsVal!)
    setKg('')
    setReps('')
  }

  return (
    <div className="rounded-xl border border-zinc-800 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{e.name}</div>
          <div className="text-xs text-zinc-500">
            {e.standard ? `Standard: ${STANDARD_LABEL[e.standard]}` : 'ohne Standard – nur Verlauf'}
            {best && (isPullup ? ` · Bestwert ${formatDecimal(best.value, 0)} Wdh.` : ` · 1RM ≈ ${formatDecimal(best.value, 1)} kg`)}
            {improvement != null && ` · ${improvement >= 0 ? '+' : ''}${Math.round(improvement * 100)} % seit Start`}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {level != null && logs.length > 0 && <span className="text-lg font-bold tabular-nums text-sky-300">{Math.floor(level)}</span>}
          <IconButton label={`${e.name} archivieren`} onClick={() => void characterRepo.updateExercise(e.id, { archived: true })}>
            <Archive className="size-4" />
          </IconButton>
        </div>
      </div>
      {nextStandard && <p className="mt-1 text-xs text-zinc-400">{nextStandard}</p>}
      {logs.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-zinc-400">
          {[...logs].reverse().slice(0, 3).map((l) => (
            <li key={l.id} className="flex items-center justify-between">
              <span className="tabular-nums">
                {fmt(l.date, 'dd.MM.yy')}: {isPullup ? `${l.reps} Wdh.${l.weightKg ? ` +${formatDecimal(l.weightKg)} kg` : ''}` : `${formatDecimal(l.weightKg)} kg × ${l.reps}`}
              </span>
              <button type="button" aria-label="Eintrag löschen" onClick={() => void characterRepo.deleteLiftLog(l.id)} className="p-1 text-zinc-600 hover:text-rose-300">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="mt-2 flex flex-wrap items-center gap-1.5">
        <TextInput type="date" value={date} onChange={(x) => setDate(x.target.value)} aria-label="Datum" className="w-auto" />
        <TextInput value={kg} onChange={(x) => setKg(x.target.value)} inputMode="decimal" placeholder={isPullup ? '+kg' : 'kg'} aria-label={isPullup ? 'Zusatzgewicht' : 'Gewicht'} className="w-16 text-center" />
        <span className="text-zinc-500">×</span>
        <TextInput value={reps} onChange={(x) => setReps(x.target.value)} inputMode="numeric" placeholder="Wdh." aria-label="Wiederholungen" className="w-16 text-center" />
        <Button type="submit" variant="secondary" disabled={!valid}>
          <Plus className="size-4" /> Eintragen
        </Button>
      </form>
    </div>
  )
}

function AddExercise() {
  const [name, setName] = useState('')
  const [standard, setStandard] = useState<LiftStandard | ''>('')
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (!name.trim()) return
    void characterRepo.createExercise(name, standard || null)
    setName('')
    setStandard('')
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <TextInput value={name} onChange={(x) => setName(x.target.value)} placeholder="Weitere Übung, z. B. Rudern" aria-label="Neue Übung" className="min-w-[12rem] flex-1" />
      <select
        value={standard}
        onChange={(x) => setStandard(x.target.value as LiftStandard | '')}
        aria-label="Standard"
        className="min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100"
      >
        <option value="">ohne Standard</option>
        {(Object.keys(STANDARD_LABEL) as LiftStandard[]).map((k) => (
          <option key={k} value={k}>
            wie {STANDARD_LABEL[k]}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary" disabled={!name.trim()}>
        <Plus className="size-4" /> Übung
      </Button>
    </form>
  )
}

function RunSection({ runs, today }: { runs: { id: string; date: DateStr; distanceKm: number; seconds: number }[]; today: DateStr }) {
  const [date, setDate] = useState(today)
  const [km, setKm] = useState('5')
  const [time, setTime] = useState('')
  const d = parseDecimal(km)
  const t = parseClock(time)
  const valid = isValidDateStr(date) && d != null && d > 0 && t != null && t > 0
  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    if (!valid) return
    void characterRepo.addRunLog(date, d!, t!)
    setTime('')
  }
  return (
    <div className="space-y-2">
      {runs.length > 0 && (
        <ul className="space-y-0.5 text-xs text-zinc-400">
          {[...runs].reverse().slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <span className="tabular-nums">
                {fmt(r.date, 'dd.MM.yy')}: {formatDecimal(r.distanceKm)} km in {formatClock(r.seconds)} (5 km ≈ {formatClock(fiveKEquivalent(r.seconds, r.distanceKm))})
              </span>
              <button type="button" aria-label="Lauf löschen" onClick={() => void characterRepo.deleteRunLog(r.id)} className="p-1 text-zinc-600 hover:text-rose-300">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="flex flex-wrap items-center gap-1.5">
        <TextInput type="date" value={date} onChange={(x) => setDate(x.target.value)} aria-label="Datum" className="w-auto" />
        <TextInput value={km} onChange={(x) => setKm(x.target.value)} inputMode="decimal" aria-label="Distanz in km" className="w-14 text-center" />
        <span className="text-xs text-zinc-500">km in</span>
        <TextInput value={time} onChange={(x) => setTime(x.target.value)} placeholder="mm:ss" aria-label="Zeit" className="w-20 text-center" />
        <Button type="submit" variant="secondary" disabled={!valid}>
          <Plus className="size-4" /> Lauf
        </Button>
      </form>
      <p className="text-xs text-zinc-500">Andere Distanzen werden auf 5 km umgerechnet. Ohne Läufe zählt nur die Kraft zur Leistung.</p>
    </div>
  )
}
