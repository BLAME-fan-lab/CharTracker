import { Check, RotateCcw, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, ConfirmBar, IconButton, SegmentedControl, TextInput } from '../../components/ui'
import { todosRepo, type Priority, type Todo, type TodoCategory } from '../../data'
import { cx } from '../../lib/cx'
import { addDaysStr, isValidDateStr, todayStr } from '../../lib/dates'

/** Anlegen/Bearbeiten eines To-dos. `todo` = undefined → neues To-do. */
export function TodoEditor({
  todo,
  categories,
  defaults,
  onClose,
}: {
  todo: Todo | undefined
  categories: TodoCategory[]
  defaults?: { categoryId: string | null }
  onClose: () => void
}) {
  const [title, setTitle] = useState(todo?.title ?? '')
  const [dueDate, setDueDate] = useState(todo?.dueDate ?? '')
  const [priority, setPriority] = useState<Priority>(todo?.priority ?? 'medium')
  const [categoryId, setCategoryId] = useState<string | null>(todo?.categoryId ?? defaults?.categoryId ?? null)
  const [note, setNote] = useState(todo?.note ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const today = todayStr()

  const selectable = categories.filter((c) => !c.archived || c.id === todo?.categoryId)
  const valid = title.trim() !== '' && (dueDate === '' || isValidDateStr(dueDate))

  const save = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!valid) return
    const input = { title, dueDate: dueDate || null, priority, categoryId, note: note || null }
    if (todo) await todosRepo.updateTodo(todo.id, input)
    else await todosRepo.createTodo(input)
    onClose()
  }

  return (
    <Sheet
      label={todo ? 'To-do bearbeiten' : 'Neues To-do'}
      onClose={onClose}
      header={
        <header className="flex items-center gap-2 px-4 py-3">
          <h2 className="flex-1 text-base font-semibold">{todo ? 'To-do bearbeiten' : 'Neues To-do'}</h2>
          <IconButton label="Schließen" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </header>
      }
    >
      <form onSubmit={save} className="space-y-5">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Titel</span>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Was ist zu tun?"
            autoFocus={!todo}
            enterKeyHint="done"
          />
        </label>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Fällig am</span>
          <div className="flex flex-wrap items-center gap-2">
            <TextInput
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Fälligkeitsdatum"
              className="w-auto"
            />
            <QuickChip active={dueDate === today} onClick={() => setDueDate(today)}>
              Heute
            </QuickChip>
            <QuickChip active={dueDate === addDaysStr(today, 1)} onClick={() => setDueDate(addDaysStr(today, 1))}>
              Morgen
            </QuickChip>
            <QuickChip active={dueDate === ''} onClick={() => setDueDate('')}>
              Kein Datum
            </QuickChip>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-zinc-400">Priorität</span>
          <SegmentedControl
            value={priority}
            onChange={setPriority}
            options={[
              { value: 'high', label: 'Hoch' },
              { value: 'medium', label: 'Mittel' },
              { value: 'low', label: 'Niedrig' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-zinc-400">Kategorie</span>
          <div className="flex flex-wrap gap-2">
            <QuickChip active={categoryId == null} onClick={() => setCategoryId(null)}>
              Keine
            </QuickChip>
            {selectable.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={categoryId === c.id}
                className={cx(
                  'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                  categoryId === c.id ? 'border-transparent text-zinc-950' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500',
                )}
                style={categoryId === c.id ? { backgroundColor: c.color } : undefined}
              >
                {categoryId !== c.id && <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />}
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-400">Notiz (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" type="submit" disabled={!valid}>
            <Check className="size-4" />
            {todo ? 'Speichern' : 'Anlegen'}
          </Button>
        </div>

        {todo && (
          <div className="space-y-2 border-t border-zinc-800 pt-4">
            {confirmDelete ? (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <ConfirmBar
                  text={`„${todo.title}“ löschen?`}
                  confirmLabel="Löschen"
                  danger
                  onConfirm={() => {
                    void todosRepo.deleteTodo(todo.id)
                    onClose()
                  }}
                  onCancel={() => setConfirmDelete(false)}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    void todosRepo.setTodoDone(todo.id, todo.doneDate == null)
                    onClose()
                  }}
                >
                  {todo.doneDate ? (
                    <>
                      <RotateCcw className="size-4" /> Wieder öffnen
                    </>
                  ) : (
                    <>
                      <Check className="size-4" /> Erledigt
                    </>
                  )}
                </Button>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" /> Löschen
                </Button>
              </div>
            )}
          </div>
        )}
      </form>
    </Sheet>
  )
}

function QuickChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'min-h-8 rounded-full border px-3 text-sm transition-colors',
        active ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500',
      )}
    >
      {children}
    </button>
  )
}
