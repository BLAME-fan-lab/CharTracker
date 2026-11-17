import { todayStr, type DateStr } from '../../lib/dates'
import { alive, byOrder, changed, created } from '../base'
import { db } from '../db'
import type { BaseRecord, Todo, TodoCategory } from '../types'

/* ---------- To-dos ---------- */

export type TodoInput = Omit<Todo, keyof BaseRecord | 'doneDate'>

export async function listTodos(): Promise<Todo[]> {
  return (await db.todos.toArray()).filter(alive)
}

const clean = <T extends Partial<TodoInput>>(input: T): T => ({
  ...input,
  ...(input.title !== undefined && { title: input.title.trim() }),
  ...(input.note !== undefined && { note: input.note?.trim() ? input.note.trim() : null }),
})

export async function createTodo(input: TodoInput): Promise<string> {
  const todo = created({ ...clean(input), doneDate: null })
  await db.todos.add(todo)
  return todo.id
}

export async function updateTodo(id: string, patch: Partial<TodoInput>): Promise<void> {
  await db.todos.update(id, changed(clean(patch)))
}

export async function setTodoDone(id: string, done: boolean, date: DateStr = todayStr()): Promise<void> {
  await db.todos.update(id, changed({ doneDate: done ? date : null }))
}

export async function deleteTodo(id: string): Promise<void> {
  const now = Date.now()
  await db.todos.update(id, { deletedAt: now, updatedAt: now })
}

/** Gelöschtes To-do wiederherstellen (für „Rückgängig“). */
export async function restoreTodo(id: string): Promise<void> {
  await db.todos.update(id, changed({ deletedAt: null }))
}

/* ---------- Kategorien ---------- */

export const CATEGORY_COLORS = ['#38bdf8', '#f59e0b', '#a78bfa', '#34d399', '#f472b6', '#f87171', '#facc15', '#94a3b8']

export async function listTodoCategories(): Promise<TodoCategory[]> {
  return (await db.todoCategories.toArray()).filter(alive).sort(byOrder)
}

export async function createTodoCategory(name: string, color?: string): Promise<string> {
  const categories = await listTodoCategories()
  const order = categories.reduce((max, c) => Math.max(max, c.order), -1) + 1
  const category = created({
    name: name.trim(),
    color: color ?? CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
    order,
    archived: false,
  })
  await db.todoCategories.add(category)
  return category.id
}

export async function updateTodoCategory(id: string, patch: Partial<Pick<TodoCategory, 'name' | 'color'>>): Promise<void> {
  await db.todoCategories.update(id, changed({ ...patch, ...(patch.name !== undefined && { name: patch.name.trim() }) }))
}

/** Archivierte Kategorien bleiben an bestehenden To-dos sichtbar, sind aber nicht mehr wählbar. */
export async function setTodoCategoryArchived(id: string, archived: boolean): Promise<void> {
  await db.todoCategories.update(id, changed({ archived }))
}
