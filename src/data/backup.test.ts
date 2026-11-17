import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { backupFileName, checkBackup, createBackup, markBackupDone, parseBackupText, resetAllData, restoreBackup } from './backup'
import { db } from './db'
import * as habits from './repo/habits'
import * as todos from './repo/todos'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('Backup', () => {
  it('Export → Ersetzen stellt den exakten Stand wieder her', async () => {
    const [h] = await habits.listHabits()
    await habits.setHabitDone(h.id, '2026-11-17', true)
    const todoId = await todos.createTodo({ title: 'Backup testen', dueDate: null, priority: 'high', categoryId: null, note: null })
    const backup = await createBackup()
    expect(backup.app).toBe('tracker')

    // Danach Änderungen, die durch das Backup verschwinden sollen
    await todos.deleteTodo(todoId)
    await todos.createTodo({ title: 'Später angelegt', dueDate: null, priority: 'low', categoryId: null, note: null })

    const check = parseBackupText(JSON.stringify(backup))
    expect(check.ok).toBe(true)
    if (!check.ok) return
    expect(check.counts.habitLogs).toBe(1)
    await restoreBackup(check.backup, 'replace')

    expect((await todos.listTodos()).map((t) => t.title)).toEqual(['Backup testen'])
    expect(await habits.listHabitLogs()).toHaveLength(1)
  })

  it('Zusammenführen: neuerer Stand gewinnt, Neues kommt dazu', async () => {
    const a = await todos.createTodo({ title: 'A', dueDate: null, priority: 'medium', categoryId: null, note: null })
    const backup = await createBackup()
    // Backup-Kopie: A umbenannt (neuer), B neu
    const rows = backup.tables.todos.map((t) => (t.id === a ? { ...t, title: 'A (aus Backup)', updatedAt: Date.now() + 1000 } : t))
    rows.push({ ...rows[0], id: 'b', title: 'B', updatedAt: 1 })
    const local = await todos.createTodo({ title: 'Nur lokal', dueDate: null, priority: 'medium', categoryId: null, note: null })

    await restoreBackup({ ...backup, tables: { ...backup.tables, todos: rows } }, 'merge')
    const titles = (await todos.listTodos()).map((t) => t.title).sort()
    expect(titles).toEqual(['A (aus Backup)', 'B', 'Nur lokal'])
    expect((await todos.listTodos()).find((t) => t.id === local)).toBeDefined()
  })

  it('Zusammenführen: älterer Stand überschreibt nicht', async () => {
    const id = await todos.createTodo({ title: 'Neu', dueDate: null, priority: 'medium', categoryId: null, note: null })
    const backup = await createBackup()
    const old = backup.tables.todos.map((t) => ({ ...t, title: 'Alt', updatedAt: 1 }))
    await restoreBackup({ ...backup, tables: { ...backup.tables, todos: old } }, 'merge')
    expect((await todos.listTodos()).find((t) => t.id === id)?.title).toBe('Neu')
  })

  it('erkennt ungültige Dateien', () => {
    expect(parseBackupText('kein json')).toMatchObject({ ok: false })
    expect(checkBackup({ app: 'andere-app', version: 1, tables: {} })).toMatchObject({ ok: false })
    expect(checkBackup({ app: 'tracker', version: 99, tables: {} })).toMatchObject({ ok: false })
    expect(checkBackup({ app: 'tracker', version: 1, tables: { todos: [] } })).toMatchObject({ ok: false, error: 'Das Backup ist leer.' })
    const r = checkBackup({ app: 'tracker', version: 1, tables: { todos: [{ id: 'x', title: 'ok' }, { title: 'ohne id' }, 7] } })
    expect(r).toMatchObject({ ok: true, skipped: 2 })
  })

  it('Ersetzen ohne Einstellungen behält die bisherigen', async () => {
    const r = checkBackup({ app: 'tracker', version: 1, tables: { todos: [{ id: 'x', title: 'T', updatedAt: 1, deletedAt: null }] } })
    if (!r.ok) throw new Error(r.error)
    await restoreBackup(r.backup, 'replace')
    expect(await db.settings.get('app')).toBeDefined()
    expect(await db.habits.count()).toBe(0)
  })

  it('Backup-Zeitpunkt, Dateiname und Zurücksetzen', async () => {
    await markBackupDone()
    expect((await db.settings.get('app'))?.lastBackupAt).toBeTypeOf('number')
    expect(backupFileName(new Date(2026, 10, 7))).toBe('tracker-backup-2026-11-07.json')
    await todos.createTodo({ title: 'weg', dueDate: null, priority: 'medium', categoryId: null, note: null })
    await resetAllData()
    expect(await todos.listTodos()).toHaveLength(0)
    expect(await habits.listHabits()).toHaveLength(5)
  })
})
