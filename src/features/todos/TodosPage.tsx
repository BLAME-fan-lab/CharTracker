import { ListTodo, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card, SegmentedControl, Spinner, TextInput } from '../../components/ui'
import { todosRepo, useTodoCategories, useTodos, type Priority } from '../../data'
import {
  DUE_GROUP_LABEL,
  filterTodos,
  groupByDue,
  PRIORITY_LABEL,
  sortTodos,
  type TodoFilter,
  type TodoSort,
} from '../../domain/todos'
import { cx } from '../../lib/cx'
import { useParamSheet } from '../../lib/useParamSheet'
import { useToday } from '../../lib/useToday'
import { TodoEditor } from './TodoEditor'
import { TodoItem } from './TodoItem'

interface ViewState extends TodoFilter {
  sort: TodoSort
}

const DEFAULT_VIEW: ViewState = { categoryId: null, priority: null, showDone: false, sort: 'due' }
const STORAGE_KEY = 'todos.view'

/** Filter/Sortierung pro Gerät merken (reine Bequemlichkeit). */
function useStoredView(): [ViewState, (patch: Partial<ViewState>) => void] {
  const [view, setView] = useState<ViewState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? { ...DEFAULT_VIEW, ...(JSON.parse(raw) as Partial<ViewState>) } : DEFAULT_VIEW
    } catch {
      return DEFAULT_VIEW
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(view))
    } catch {
      /* Speicher nicht verfügbar – egal */
    }
  }, [view])
  return [view, (patch) => setView((v) => ({ ...v, ...patch }))]
}

export function TodosPage() {
  const todos = useTodos()
  const categories = useTodoCategories()
  const today = useToday()
  const [view, update] = useStoredView()
  const editor = useParamSheet('todo')
  const [quick, setQuick] = useState('')

  if (!todos || !categories) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">To-dos</h1>
        <Spinner />
      </div>
    )
  }

  // Filter auf eine gelöschte/unbekannte Kategorie zurücksetzen
  const categoryFilter =
    view.categoryId == null || view.categoryId === 'none' || categories.some((c) => c.id === view.categoryId)
      ? view.categoryId
      : null
  const filtered = sortTodos(filterTodos(todos, { ...view, categoryId: categoryFilter }), view.sort)
  const openCount = todos.filter((t) => !t.doneDate).length
  const doneCount = todos.length - openCount
  const categoryOf = (id: string | null) => categories.find((c) => c.id === id)

  const groups =
    view.sort === 'due'
      ? groupByDue(filtered, today).map((g) => ({ key: g.status, label: DUE_GROUP_LABEL[g.status], items: g.items }))
      : (['high', 'medium', 'low'] as Priority[])
          .map((p) => ({
            key: p,
            label: `Priorität ${PRIORITY_LABEL[p].toLowerCase()}`,
            items: filtered.filter((t) => t.priority === p),
          }))
          .filter((g) => g.items.length > 0)

  const editing = editor.value
  const editTodo = editing && editing !== 'neu' ? todos.find((t) => t.id === editing) : undefined

  const quickAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!quick.trim()) return
    void todosRepo.createTodo({
      title: quick,
      dueDate: null,
      priority: view.priority ?? 'medium',
      categoryId: categoryFilter && categoryFilter !== 'none' ? categoryFilter : null,
      note: null,
    })
    setQuick('')
  }

  const activeCategories = categories.filter((c) => !c.archived)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">To-dos</h1>
          <p className="text-xs text-zinc-400">
            {openCount} offen{doneCount > 0 && ` · ${doneCount} erledigt`}
          </p>
        </div>
        <Button variant="primary" onClick={() => editor.open('neu')}>
          <Plus className="size-4" /> Neu
        </Button>
      </div>

      <form onSubmit={quickAdd} className="flex gap-2">
        <TextInput
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder="Schnell hinzufügen (ohne Datum) …"
          aria-label="To-do schnell hinzufügen"
          enterKeyHint="done"
        />
        <Button type="submit" variant="secondary" disabled={!quick.trim()} className="shrink-0" aria-label="Hinzufügen">
          <Plus className="size-4" />
        </Button>
      </form>

      {/* Filter */}
      <div className="space-y-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <FilterChip active={categoryFilter == null} onClick={() => update({ categoryId: null })}>
            Alle
          </FilterChip>
          {activeCategories.map((c) => (
            <FilterChip key={c.id} active={categoryFilter === c.id} onClick={() => update({ categoryId: c.id })} color={c.color}>
              {c.name}
            </FilterChip>
          ))}
          <FilterChip active={categoryFilter === 'none'} onClick={() => update({ categoryId: 'none' })}>
            Ohne Kategorie
          </FilterChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            value={view.priority ?? 'all'}
            onChange={(v) => update({ priority: v === 'all' ? null : (v as Priority) })}
            options={[
              { value: 'all', label: 'Alle' },
              { value: 'high', label: 'Hoch' },
              { value: 'medium', label: 'Mittel' },
              { value: 'low', label: 'Niedrig' },
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="sr-only sm:not-sr-only">Sortierung</span>
            <select
              value={view.sort}
              onChange={(e) => update({ sort: e.target.value as TodoSort })}
              className="min-h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
              aria-label="Sortierung"
            >
              <option value="due">nach Fälligkeit</option>
              <option value="priority">nach Priorität</option>
            </select>
          </label>
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={view.showDone}
              onChange={(e) => update({ showDone: e.target.checked })}
              className="size-4 accent-emerald-500"
            />
            Erledigte zeigen
          </label>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
          <ListTodo className="mb-3 size-8 text-zinc-600" />
          <p className="text-sm text-zinc-400">
            {todos.length === 0
              ? 'Noch keine To-dos. Leg oben dein erstes an.'
              : 'Keine To-dos für diesen Filter.'}
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <Card
            key={g.key}
            title={
              <span className={cx(g.key === 'overdue' && 'text-rose-300', g.key === 'today' && 'text-emerald-300')}>
                {g.label}
              </span>
            }
            action={<span className="text-xs tabular-nums text-zinc-500">{g.items.length}</span>}
            className="pb-1 sm:pb-1"
          >
            <ul className="-mt-1 divide-y divide-zinc-800">
              {g.items.map((t) => (
                <li key={t.id}>
                  <TodoItem todo={t} category={categoryOf(t.categoryId)} today={today} onOpen={() => editor.open(t.id)} />
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}

      {editing && (editing === 'neu' || editTodo) && (
        <TodoEditor
          key={editing}
          todo={editTodo}
          categories={categories}
          defaults={{ categoryId: categoryFilter && categoryFilter !== 'none' ? categoryFilter : null }}
          onClose={editor.close}
        />
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  color?: string
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors',
        active ? 'border-zinc-500 bg-zinc-700 text-zinc-50' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600',
      )}
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  )
}
