import { Link } from 'react-router'
import { Card, Spinner } from '../../../components/ui'
import { useHabits, type HabitSkill } from '../../../data'
import { habitSkill } from '../../../domain/characterSheet'

const DAY = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

/** Welche Gewohnheiten zu Gesundheit bzw. Hygiene zählen. */
export function HabitSkillInfo({ skill }: { skill: Exclude<HabitSkill, 'none'> }) {
  const habits = useHabits()
  if (!habits) return <Spinner />
  const mine = habits.filter((h) => h.archivedFrom == null && habitSkill(h) === skill)
  return (
    <Card title="Zugeordnete Routinen">
      {mine.length === 0 ? (
        <p className="text-sm text-zinc-400">Noch keine Gewohnheit diesem Bereich zugeordnet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {mine.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2">
              <span>{h.name}</span>
              <span className="text-xs text-zinc-500">
                {h.weekdays?.length ? `nur ${h.weekdays.map((d) => DAY[d - 1]).join(', ')}` : 'täglich'}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        Zuordnung und Wochentage änderst du unter{' '}
        <Link to="/einstellungen" className="text-emerald-300 underline underline-offset-2">
          Einstellungen → Tägliche Ziele
        </Link>
        {skill === 'hygiene' && '. Tipp: „Aufräumen & Müll“ als Gewohnheit nur samstags anlegen'}.
      </p>
    </Card>
  )
}
