import { Flag, StickyNote } from 'lucide-react'
import { CheckCircle } from '../../components/ui'
import { todosRepo, type Todo, type TodoCategory } from '../../data'
import { dueStatus, PRIORITY_LABEL, relativeDue } from '../../domain/todos'
import { cx } from '../../lib/cx'
import { fmt, type DateStr } from '../../lib/dates'

const PRIORITY_COLOR: Record<Todo['priority'], string> = {
  high: 'text-rose-400',
  medium: 'text-amber-400',
  low: 'text-zinc-500',
}

export function CategoryChip({ category }: { category: TodoCategory }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-medium"
      style={{ backgroundColor: `${category.color}26`, color: category.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  )
}

/** Eine To-do-Zeile: Haken, Titel, Fälligkeit, Priorität, Kategorie. */
export function TodoItem({
  todo,
  category,
  today,
  showDue = true,
  onOpen,
  compact,
}: {
  todo: Todo
  category: TodoCategory | undefined
  today: DateStr
  showDue?: boolean
  onOpen?: () => void
  compact?: boolean
}) {
  const done = todo.doneDate != null
  const status = dueStatus(todo, today)
  const rel = todo.dueDate ? relativeDue(todo.dueDate, today) : ''

  return (
    <div className={cx('flex items-start gap-3', compact ? 'py-1.5' : 'py-2.5')}>
      <div className="pt-0.5">
        <CheckCircle
          checked={done}
          onToggle={() => void todosRepo.setTodoDone(todo.id, !done, today)}
          label={`${todo.title} ${done ? 'als offen markieren' : 'erledigt'}`}
        />
      </div>
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <div className={cx('text-sm leading-snug break-words', done ? 'text-zinc-500 line-through' : 'text-zinc-100')}>
          {todo.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {showDue && todo.dueDate && (
            <span
              className={cx(
                'tabular-nums',
                status === 'overdue' ? 'font-medium text-rose-400' : status === 'today' ? 'text-emerald-400' : 'text-zinc-400',
              )}
            >
              {fmt(todo.dueDate, 'EE dd.MM.')}
              {rel && ` · ${rel}`}
            </span>
          )}
          {!showDue && status === 'overdue' && todo.dueDate && (
            <span className="font-medium text-rose-400">überfällig seit {fmt(todo.dueDate, 'dd.MM.')}</span>
          )}
          {todo.priority !== 'medium' && (
            <span className={cx('inline-flex items-center gap-0.5', PRIORITY_COLOR[todo.priority])}>
              <Flag className="size-3" />
              {PRIORITY_LABEL[todo.priority]}
            </span>
          )}
          {category && <CategoryChip category={category} />}
          {todo.note && <StickyNote className="size-3 text-zinc-500" aria-label="Hat Notiz" />}
        </div>
      </button>
    </div>
  )
}
