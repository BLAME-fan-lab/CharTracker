import { describe, expect, it } from 'vitest'
import { dueStatus, filterTodos, groupByDue, relativeDue, sortTodos, todosForDay, type TodoLike } from './todos'

let n = 0
const t = (p: Partial<TodoLike>): TodoLike => ({
  id: `t${++n}`,
  dueDate: null,
  priority: 'medium',
  categoryId: null,
  doneDate: null,
  createdAt: n,
  ...p,
})

const TODAY = '2026-11-17'

describe('dueStatus', () => {
  it('ordnet richtig ein', () => {
    expect(dueStatus(t({ dueDate: '2026-11-16' }), TODAY)).toBe('overdue')
    expect(dueStatus(t({ dueDate: TODAY }), TODAY)).toBe('today')
    expect(dueStatus(t({ dueDate: '2026-11-24' }), TODAY)).toBe('soon')
    expect(dueStatus(t({ dueDate: '2026-11-25' }), TODAY)).toBe('later')
    expect(dueStatus(t({}), TODAY)).toBe('none')
    expect(dueStatus(t({ dueDate: '2026-11-01', doneDate: '2026-11-02' }), TODAY)).toBe('done')
  })
})

describe('sortTodos', () => {
  const a = t({ id: 'a', dueDate: '2026-11-20', priority: 'low' })
  const b = t({ id: 'b', dueDate: '2026-11-18', priority: 'low' })
  const c = t({ id: 'c', dueDate: null, priority: 'high' })
  const d = t({ id: 'd', dueDate: '2026-11-20', priority: 'high' })

  it('nach Fälligkeit, ohne Datum zuletzt, dann Priorität', () => {
    expect(sortTodos([a, b, c, d], 'due').map((x) => x.id)).toEqual(['b', 'd', 'a', 'c'])
  })
  it('nach Priorität, dann Fälligkeit', () => {
    expect(sortTodos([a, b, c, d], 'priority').map((x) => x.id)).toEqual(['d', 'c', 'b', 'a'])
  })
})

describe('filterTodos', () => {
  const uni = t({ categoryId: 'uni', priority: 'high' })
  const priv = t({ categoryId: 'privat', priority: 'low' })
  const none = t({ categoryId: null })
  const done = t({ categoryId: 'uni', doneDate: TODAY })
  const all = [uni, priv, none, done]

  it('blendet Erledigte aus', () => {
    expect(filterTodos(all, { categoryId: null, priority: null, showDone: false })).toHaveLength(3)
    expect(filterTodos(all, { categoryId: null, priority: null, showDone: true })).toHaveLength(4)
  })
  it('filtert nach Kategorie und Priorität', () => {
    expect(filterTodos(all, { categoryId: 'uni', priority: null, showDone: true })).toEqual([uni, done])
    expect(filterTodos(all, { categoryId: 'none', priority: null, showDone: true })).toEqual([none])
    expect(filterTodos(all, { categoryId: null, priority: 'low', showDone: false })).toEqual([priv])
  })
})

describe('groupByDue', () => {
  it('feste Reihenfolge der Gruppen', () => {
    const groups = groupByDue(
      [t({}), t({ dueDate: TODAY }), t({ dueDate: '2026-11-10' }), t({ dueDate: TODAY, doneDate: TODAY })],
      TODAY,
    )
    expect(groups.map((g) => g.status)).toEqual(['overdue', 'today', 'none', 'done'])
  })
})

describe('todosForDay', () => {
  const overdue = t({ id: 'over', dueDate: '2026-11-10' })
  const overdueDone = t({ id: 'overDone', dueDate: '2026-11-10', doneDate: '2026-11-12' })
  const todayOpen = t({ id: 'today', dueDate: TODAY })
  const todayDone = t({ id: 'todayDone', dueDate: TODAY, doneDate: TODAY })
  const tomorrow = t({ id: 'tomorrow', dueDate: '2026-11-18' })
  const all = [overdue, overdueDone, todayOpen, todayDone, tomorrow]

  it('heute: fällige + überfällige offene, erledigte zuletzt', () => {
    expect(todosForDay(all, TODAY, TODAY).map((x) => x.id)).toEqual(['over', 'today', 'todayDone'])
  })
  it('anderer Tag: nur Fälligkeit an dem Tag', () => {
    expect(todosForDay(all, '2026-11-18', TODAY).map((x) => x.id)).toEqual(['tomorrow'])
    expect(todosForDay(all, '2026-11-10', TODAY).map((x) => x.id)).toEqual(['over', 'overDone'])
  })
})

describe('relativeDue', () => {
  it('formuliert relativ', () => {
    expect(relativeDue(TODAY, TODAY)).toBe('heute')
    expect(relativeDue('2026-11-18', TODAY)).toBe('morgen')
    expect(relativeDue('2026-11-14', TODAY)).toBe('seit 3 Tagen')
    expect(relativeDue('2026-11-20', TODAY)).toBe('in 3 Tagen')
    expect(relativeDue('2026-12-20', TODAY)).toBe('')
  })
})
