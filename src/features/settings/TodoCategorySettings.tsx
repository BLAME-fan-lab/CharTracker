import { Archive, ArchiveRestore, Check, Pencil, Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, IconButton, Spinner, TextInput } from '../../components/ui'
import { todosRepo, useTodoCategories, type TodoCategory } from '../../data'
import { cx } from '../../lib/cx'

export function TodoCategorySettings() {
  const categories = useTodoCategories()
  const [name, setName] = useState('')
  if (!categories) {
    return (
      <Card title="To-do-Kategorien">
        <Spinner />
      </Card>
    )
  }
  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    void todosRepo.createTodoCategory(name)
    setName('')
  }
  return (
    <Card title="To-do-Kategorien">
      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Neue Kategorie …" aria-label="Neue Kategorie" />
        <Button type="submit" variant="secondary" disabled={!name.trim()} className="shrink-0">
          <Plus className="size-4" /> Hinzufügen
        </Button>
      </form>
      <p className="mt-3 text-xs text-zinc-500">
        Archivierte Kategorien bleiben an bestehenden To-dos sichtbar, sind aber nicht mehr auswählbar.
      </p>
    </Card>
  )
}

function CategoryRow({ category }: { category: TodoCategory }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color)

  if (editing) {
    return (
      <li className="space-y-3 p-3">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" autoFocus />
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Farbe">
          {todosRepo.CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={`Farbe ${c}`}
              onClick={() => setColor(c)}
              className={cx('size-8 rounded-full ring-offset-2 ring-offset-zinc-900', color === c && 'ring-2 ring-zinc-100')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            <X className="size-4" /> Abbrechen
          </Button>
          <Button
            variant="primary"
            disabled={!name.trim()}
            onClick={() => {
              void todosRepo.updateTodoCategory(category.id, { name, color })
              setEditing(false)
            }}
          >
            <Check className="size-4" /> Speichern
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2 py-1 pr-1 pl-3">
      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
      <span className={cx('flex-1 text-sm', category.archived && 'text-zinc-500 line-through')}>{category.name}</span>
      <IconButton
        label="Bearbeiten"
        onClick={() => {
          setName(category.name)
          setColor(category.color)
          setEditing(true)
        }}
      >
        <Pencil className="size-4" />
      </IconButton>
      <IconButton
        label={category.archived ? 'Wiederherstellen' : 'Archivieren'}
        onClick={() => void todosRepo.setTodoCategoryArchived(category.id, !category.archived)}
      >
        {category.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
      </IconButton>
    </li>
  )
}
