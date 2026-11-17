import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Card, ConfirmBar, IconButton, SegmentedControl, Spinner, TextInput } from '../../../components/ui'
import { characterRepo, useBooks, type Book, type BookDifficulty, type BookStatus } from '../../../data'
import type { DateStr } from '../../../lib/dates'
import { DIFFICULTY_LABEL } from '../labels'

const STATUS_LABEL: Record<BookStatus, string> = { reading: 'lese ich', paused: 'pausiert', done: 'fertig' }

export function ReadingEditor({ today }: { today: DateStr }) {
  const books = useBooks()
  if (!books) return <Spinner />
  return (
    <Card title="Bücher">
      <div className="space-y-3">
        {books.length > 0 && (
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {books.map((b) => (
              <BookRow key={b.id} book={b} today={today} />
            ))}
          </ul>
        )}
        <AddBook today={today} />
        <p className="text-xs leading-relaxed text-zinc-500">
          <b className="text-zinc-400">leicht</b>: Unterhaltung, Krimis, leichte Romane · <b className="text-zinc-400">mittel</b>: Sachbücher,
          anspruchsvolle Romane · <b className="text-zinc-400">schwer</b>: Fachbücher, Philosophie, Klassiker im Original. Lesezeit trägst du im
          Tages-Panel pro Buch ein.
        </p>
      </div>
    </Card>
  )
}

function BookRow({ book, today }: { book: Book; today: DateStr }) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) {
    return (
      <li>
        <ConfirmBar
          text={`„${book.title}“ entfernen? Die Lesezeit bleibt erhalten und zählt dann als „mittel“.`}
          confirmLabel="Entfernen"
          danger
          onConfirm={() => void characterRepo.deleteBook(book.id)}
          onCancel={() => setConfirming(false)}
        />
      </li>
    )
  }
  return (
    <li className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium break-words">{book.title}</span>
        <IconButton label="Buch entfernen" onClick={() => setConfirming(true)} className="-mt-1 -mr-1">
          <Trash2 className="size-4" />
        </IconButton>
      </div>
      <div className="flex flex-wrap gap-2">
        <SegmentedControl
          value={book.difficulty}
          onChange={(difficulty) => void characterRepo.updateBook(book.id, { difficulty })}
          options={(['easy', 'medium', 'hard'] as const).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }))}
        />
        <SegmentedControl
          value={book.status}
          onChange={(status) =>
            void characterRepo.updateBook(book.id, { status, endDate: status === 'done' ? (book.endDate ?? today) : null })
          }
          options={(['reading', 'paused', 'done'] as const).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
        />
      </div>
    </li>
  )
}

function AddBook({ today }: { today: DateStr }) {
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<BookDifficulty>('medium')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    void characterRepo.createBook(title, difficulty, today)
    setTitle('')
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl bg-zinc-950/50 p-3">
      <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel des Buchs" aria-label="Buchtitel" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          value={difficulty}
          onChange={setDifficulty}
          options={(['easy', 'medium', 'hard'] as const).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }))}
        />
        <Button type="submit" variant="primary" disabled={!title.trim()}>
          <Plus className="size-4" /> Buch
        </Button>
      </div>
    </form>
  )
}
