import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Card, Spinner } from '../../components/ui'
import { useTodoCategories, useTodos } from '../../data'
import { todosForDay } from '../../domain/todos'
import { cx } from '../../lib/cx'
import { fmt, type DateStr } from '../../lib/dates'
import { TodoItem } from '../todos/TodoItem'

/** Fällige To-dos pro Tag der Woche; überfällige erscheinen beim heutigen Tag. */
export function WeekTodos({ days, today, onOpenDay }: { days: DateStr[]; today: DateStr; onOpenDay: (d: DateStr) => void }) {
  const todos = useTodos()
  const categories = useTodoCategories()
  const navigate = useNavigate()

  const link = (
    <Link to="/todos" className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-200">
      Alle <ChevronRight className="size-3.5" />
    </Link>
  )

  if (!todos || !categories) {
    return (
      <Card title="To-dos">
        <Spinner />
      </Card>
    )
  }

  const perDay = days.map((d) => ({ day: d, items: todosForDay(todos, d, today) })).filter((x) => x.items.length > 0)
  const open = perDay.reduce((n, x) => n + x.items.filter((t) => !t.doneDate).length, 0)

  return (
    <Card title={`To-dos${open > 0 ? ` · ${open} offen` : ''}`} action={link}>
      {perDay.length === 0 ? (
        <p className="text-sm text-zinc-500">Keine fälligen To-dos in dieser Woche.</p>
      ) : (
        <div className="space-y-3">
          {perDay.map(({ day, items }) => (
            <div key={day}>
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                className={cx(
                  'mb-0.5 text-xs font-semibold tracking-wide uppercase hover:underline',
                  day === today ? 'text-emerald-400' : 'text-zinc-500',
                )}
              >
                {fmt(day, 'EEEE, d.M.')}
                {day === today && ' · heute'}
              </button>
              <ul className="divide-y divide-zinc-800/70">
                {items.map((t) => (
                  <li key={t.id}>
                    <TodoItem
                      todo={t}
                      category={categories.find((c) => c.id === t.categoryId)}
                      today={today}
                      showDue={false}
                      compact
                      onOpen={() => navigate(`/todos?todo=${t.id}`)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
