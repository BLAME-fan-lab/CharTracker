import { useNavigate } from 'react-router'
import { SegmentedControl } from '../components/ui'
import { monthOf, todayStr, weekStartOf, type DateStr } from '../lib/dates'

/**
 * Kopf der Übersicht mit Umschalter Woche/Monat.
 * `focus` ist der gerade betrachtete Tag – beim Umschalten bleibt man im selben Zeitraum.
 */
export function OverviewHeader({ mode, focus }: { mode: 'week' | 'month'; focus: DateStr }) {
  const navigate = useNavigate()
  const switchTo = (m: 'week' | 'month') => {
    if (m === mode) return
    const today = todayStr()
    if (m === 'month') {
      const month = monthOf(focus)
      navigate(month === monthOf(today) ? '/monat' : `/monat?m=${month}`, { replace: true })
    } else {
      const week = weekStartOf(focus)
      navigate(week === weekStartOf(today) ? '/woche' : `/woche?w=${week}`, { replace: true })
    }
  }
  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold">Übersicht</h1>
      <SegmentedControl
        value={mode}
        options={[
          { value: 'week', label: 'Woche' },
          { value: 'month', label: 'Monat' },
        ]}
        onChange={switchTo}
      />
    </div>
  )
}
