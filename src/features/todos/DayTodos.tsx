import { ListTodo, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button, Spinner, TextInput } from '../../components/ui'
import { todosRepo, useTodoCategories, useTodos } from '../../data'
import { todosForDay } from '../../domain/todos'
import type { DateStr } from '../../lib/dates'
import { useToday } from '../../lib/useToday'
import { TodoItem } from './TodoItem'

/** To-dos im Tages-Panel: fällige (+ überfällige am heutigen Tag) und Schnell-Eingabe für diesen Tag. */
export function DayTodos({ day }: { day: DateStr }) {
  const todos = useTodos()
  const categories = useTodoCategories()
  const today = useToday()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')

  if (!todos || !categories) return <Spinner />
  const items = todosForDay(todos, day, today)
  const open = items.filter((t) => !t.doneDate).length

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    void todosRepo.createTodo({ title, dueDate: day, priority: 'medium', categoryId: null, note: null })
    setTitle('')
  }

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <ListTodo className="size-4 text-emerald-400" />
          To-dos
        </h3>
        {items.length > 0 && <span className="text-sm tabular-nums text-zinc-400">{open} offen</span>}
      </div>
      {items.length > 0 && (
        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 px-3">
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
      )}
      <form onSubmit={add} className="flex gap-2">
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="To-do für diesen Tag …"
          aria-label="Neues To-do für diesen Tag"
          enterKeyHint="done"
        />
        <Button type="submit" variant="secondary" disabled={!title.trim()} className="shrink-0" aria-label="To-do hinzufügen">
          <Plus className="size-4" />
        </Button>
      </form>
    </section>
  )
}
