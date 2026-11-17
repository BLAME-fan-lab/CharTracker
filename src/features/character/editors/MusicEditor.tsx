import { Check } from 'lucide-react'
import { useState } from 'react'
import { Card, Spinner, TextInput } from '../../../components/ui'
import { characterRepo, useProfile } from '../../../data'
import { PIANO_MILESTONES } from '../../../domain/character'
import { cx } from '../../../lib/cx'

export function MusicEditor() {
  const profile = useProfile()
  const [instrument, setInstrument] = useState<string | null>(null)
  if (!profile) return <Spinner />
  const current = profile.musicMilestone

  return (
    <>
      <Card title="Instrument">
        <TextInput
          value={instrument ?? profile.instrument}
          onChange={(e) => setInstrument(e.target.value)}
          onBlur={() => {
            if (instrument != null && instrument.trim()) void characterRepo.updateProfile({ instrument: instrument.trim() })
            setInstrument(null)
          }}
          aria-label="Instrument"
        />
        <p className="mt-2 text-xs text-zinc-500">Übungszeit trägst du im Tages-Panel ein (Tag in der Wochenansicht antippen).</p>
      </Card>
      <Card title="Meilensteine">
        <p className="mb-3 text-xs text-zinc-500">
          Wähle ehrlich den höchsten Meilenstein, den du sicher erreicht hast. Die Leiter reicht vom Notenlernen bis zur
          internationalen Konzertkarriere.
        </p>
        <ol className="space-y-1">
          {PIANO_MILESTONES.map((m, i) => (
            <li key={m.title}>
              <button
                type="button"
                onClick={() => void characterRepo.updateProfile({ musicMilestone: i })}
                aria-pressed={i === current}
                className={cx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                  i === current ? 'bg-fuchsia-500/15 ring-1 ring-fuchsia-500/40' : 'hover:bg-zinc-800/60',
                  i > current && 'opacity-60',
                )}
              >
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-500">{m.level}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{m.title}</span>
                  <span className="block text-xs text-zinc-400">{m.detail}</span>
                </span>
                {i <= current && <Check className={cx('size-4 shrink-0', i === current ? 'text-fuchsia-300' : 'text-zinc-500')} />}
              </button>
            </li>
          ))}
        </ol>
      </Card>
    </>
  )
}
