import { diffDays, type DateStr } from '../lib/dates'

export type Priority = 'high' | 'medium' | 'low'

export const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
export const PRIORITY_LABEL: Record<Priority, string> = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' }

/** Minimale Sicht auf ein To-do – reine Logik, unabhängig von der Datenbank. */
export interface TodoLike {
  id: string
  dueDate: DateStr | null
  priority: Priority
  categoryId: string | null
  doneDate: DateStr | null
  createdAt: number
}

export type DueStatus = 'done' | 'overdue' | 'today' | 'soon' | 'later' | 'none'

/** soon = in den nächsten 7 Tagen (ab morgen) */
export function dueStatus(todo: TodoLike, today: DateStr): DueStatus {
  if (todo.doneDate) return 'done'
  if (!todo.dueDate) return 'none'
  const d = diffDays(todo.dueDate, today)
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  if (d <= 7) return 'soon'
  return 'later'
}

export const DUE_GROUP_LABEL: Record<DueStatus, string> = {
  overdue: 'Überfällig',
  today: 'Heute',
  soon: 'Nächste 7 Tage',
  later: 'Später',
  none: 'Ohne Datum',
  done: 'Erledigt',
}

const byDue = (a: TodoLike, b: TodoLike) => {
  if (a.dueDate === b.dueDate) return 0
  if (a.dueDate == null) return 1
  if (b.dueDate == null) return -1
  return a.dueDate < b.dueDate ? -1 : 1
}
const byPriority = (a: TodoLike, b: TodoLike) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
const byCreated = (a: TodoLike, b: TodoLike) => a.createdAt - b.createdAt

export type TodoSort = 'due' | 'priority'

/** Sortierung: nach Fälligkeit (ohne Datum zuletzt), dann Priorität – oder umgekehrt. */
export function sortTodos<T extends TodoLike>(todos: readonly T[], mode: TodoSort): T[] {
  const primary = mode === 'due' ? byDue : byPriority
  const secondary = mode === 'due' ? byPriority : byDue
  return [...todos].sort((a, b) => primary(a, b) || secondary(a, b) || byCreated(a, b))
}

export interface TodoFilter {
  /** null = alle, 'none' = ohne Kategorie */
  categoryId: string | null
  priority: Priority | null
  showDone: boolean
}

export function filterTodos<T extends TodoLike>(todos: readonly T[], f: TodoFilter): T[] {
  return todos.filter(
    (t) =>
      (f.showDone || !t.doneDate) &&
      (f.priority == null || t.priority === f.priority) &&
      (f.categoryId == null || (f.categoryId === 'none' ? t.categoryId == null : t.categoryId === f.categoryId)),
  )
}

const GROUP_ORDER: DueStatus[] = ['overdue', 'today', 'soon', 'later', 'none', 'done']

/** Gruppiert (bereits sortierte) To-dos nach Fälligkeit, in fester Reihenfolge. */
export function groupByDue<T extends TodoLike>(todos: readonly T[], today: DateStr): { status: DueStatus; items: T[] }[] {
  const groups = new Map<DueStatus, T[]>()
  for (const t of todos) {
    const s = dueStatus(t, today)
    groups.set(s, [...(groups.get(s) ?? []), t])
  }
  return GROUP_ORDER.filter((s) => groups.has(s)).map((status) => ({ status, items: groups.get(status)! }))
}

/**
 * To-dos für einen Kalendertag (Wochen-/Monatsansicht, Tages-Panel):
 * alle mit diesem Fälligkeitsdatum (offen oder erledigt) und – am heutigen Tag – zusätzlich alle überfälligen offenen.
 */
export function todosForDay<T extends TodoLike>(todos: readonly T[], day: DateStr, today: DateStr): T[] {
  const result = todos.filter(
    (t) => t.dueDate === day || (day === today && !t.doneDate && t.dueDate != null && t.dueDate < today),
  )
  // offene zuerst, dann nach Fälligkeit/Priorität
  return sortTodos(result, 'due').sort((a, b) => Number(a.doneDate != null) - Number(b.doneDate != null))
}

/** Lesbare Fälligkeit relativ zu heute. */
export function relativeDue(due: DateStr, today: DateStr): string {
  const d = diffDays(due, today)
  if (d === 0) return 'heute'
  if (d === 1) return 'morgen'
  if (d === -1) return 'gestern'
  if (d < 0) return `seit ${-d} Tagen`
  if (d < 7) return `in ${d} Tagen`
  return ''
}
