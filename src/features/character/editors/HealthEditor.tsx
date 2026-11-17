import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, SegmentedControl, Spinner, TextInput } from '../../../components/ui'
import { characterRepo, useBodyLogs, useProfile, type Profile } from '../../../data'
import { fmt, isValidDateStr, type DateStr } from '../../../lib/dates'
import { formatDecimal, parseDecimal } from '../../../lib/numbers'
import { HabitSkillInfo } from './HabitSkillInfo'

export function HealthEditor({ today }: { today: DateStr }) {
  const profile = useProfile()
  const body = useBodyLogs()
  if (!profile || !body) return <Spinner />
  return (
    <>
      <ProfileCard profile={profile} />
      <Card title="Gewicht & Körperfett">
        <BodyForm today={today} />
        {body.length > 0 && (
          <ul className="mt-3 space-y-0.5 text-xs text-zinc-400">
            {[...body].reverse().slice(0, 10).map((b) => (
              <li key={b.id} className="flex items-center justify-between">
                <span className="tabular-nums">
                  {fmt(b.date, 'dd.MM.yy')}: {b.weightKg != null ? `${formatDecimal(b.weightKg)} kg` : '–'}
                  {b.bodyFatPct != null && ` · ${formatDecimal(b.bodyFatPct)} % KF`}
                </span>
                <button
                  type="button"
                  aria-label="Eintrag löschen"
                  onClick={() => void characterRepo.setBodyLog(b.date, { weightKg: null, bodyFatPct: null })}
                  className="p-1 text-zinc-600 hover:text-rose-300"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <HabitSkillInfo skill="health" />
    </>
  )
}

function ProfileCard({ profile }: { profile: Profile }) {
  const [height, setHeight] = useState(formatDecimal(profile.heightCm, 0))
  return (
    <Card title="Profil">
      <div className="space-y-3 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span>Geburtsdatum</span>
          <TextInput
            type="date"
            value={profile.birthDate ?? ''}
            onChange={(e) => void characterRepo.updateProfile({ birthDate: isValidDateStr(e.target.value) ? e.target.value : null })}
            className="w-auto"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>Größe</span>
          <span className="flex items-center gap-2">
            <TextInput
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              onBlur={() => {
                const v = parseDecimal(height)
                if (v != null && v >= 100 && v <= 250) void characterRepo.updateProfile({ heightCm: v })
                else setHeight(formatDecimal(profile.heightCm, 0))
              }}
              inputMode="numeric"
              className="w-20 text-right"
            />
            <span className="w-6 text-zinc-400">cm</span>
          </span>
        </label>
        <div className="flex items-center justify-between gap-3">
          <span>Geschlecht</span>
          <SegmentedControl
            value={profile.sex ?? 'm'}
            onChange={(sex) => void characterRepo.updateProfile({ sex })}
            options={[
              { value: 'm', label: 'männlich' },
              { value: 'f', label: 'weiblich' },
            ]}
          />
        </div>
        <p className="text-xs text-zinc-500">Geschlecht und Gewicht braucht die App für die Kraft- und Körperfett-Standards.</p>
      </div>
    </Card>
  )
}

function BodyForm({ today }: { today: DateStr }) {
  const [date, setDate] = useState(today)
  const [weight, setWeight] = useState('')
  const [fat, setFat] = useState('')
  const w = parseDecimal(weight)
  const f = parseDecimal(fat)
  const valid =
    isValidDateStr(date) &&
    (w != null || f != null) &&
    (w == null || (w >= 30 && w <= 300)) &&
    (f == null || (f >= 2 && f <= 60))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    void characterRepo.setBodyLog(date, { ...(w != null && { weightKg: w }), ...(f != null && { bodyFatPct: f }) })
    setWeight('')
    setFat('')
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-1.5">
      <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Datum" className="w-auto" />
      <TextInput value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="kg" aria-label="Gewicht" className="w-20 text-center" />
      <TextInput value={fat} onChange={(e) => setFat(e.target.value)} inputMode="decimal" placeholder="% KF" aria-label="Körperfett in Prozent (optional)" className="w-20 text-center" />
      <Button type="submit" variant="secondary" disabled={!valid}>
        <Plus className="size-4" /> Eintragen
      </Button>
    </form>
  )
}
