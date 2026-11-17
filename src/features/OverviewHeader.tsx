import { useNavigate } from 'react-router'
import { SegmentedControl } from '../components/ui'

/** Kopf der Übersicht mit Umschalter Woche/Monat. */
export function OverviewHeader({ mode }: { mode: 'week' | 'month' }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold">Übersicht</h1>
      <SegmentedControl
        value={mode}
        options={[
          { value: 'week', label: 'Woche' },
          { value: 'month', label: 'Monat' },
        ]}
        onChange={(m) => navigate(m === 'week' ? '/woche' : '/monat', { replace: true })}
      />
    </div>
  )
}
