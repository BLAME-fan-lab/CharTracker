import { changed } from './base'
import { db, TABLE_NAMES, type TableName } from './db'

/*
 * Backup als JSON: alle Tabellen inkl. gelöschter Datensätze (deletedAt), damit ein
 * „Zusammenführen“ auch Löschungen überträgt – dasselbe Prinzip wie ein späterer Sync.
 */

export const BACKUP_APP = 'tracker'
export const BACKUP_VERSION = 1

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  tables: Record<TableName, Record<string, unknown>[]>
}

export type BackupCheck =
  | { ok: true; backup: BackupFile; counts: Record<TableName, number>; skipped: number }
  | { ok: false; error: string }

export type RestoreMode = 'replace' | 'merge'

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export async function createBackup(): Promise<BackupFile> {
  const tables = {} as BackupFile['tables']
  await db.transaction('r', TABLE_NAMES.map((n) => db.table(n)), async () => {
    for (const name of TABLE_NAMES) tables[name] = await db.table(name).toArray()
  })
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables }
}

export const backupFileName = (date = new Date()) =>
  `tracker-backup-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.json`

/** Nach erfolgreichem Export merken – für die Backup-Erinnerung. */
export async function markBackupDone(): Promise<void> {
  await db.settings.update('app', changed({ lastBackupAt: Date.now() }))
}

/** Prüft eingelesenes JSON. Unbekannte Tabellen werden ignoriert, ungültige Einträge übersprungen. */
export function checkBackup(raw: unknown): BackupCheck {
  if (!isRecord(raw)) return { ok: false, error: 'Die Datei enthält kein gültiges Backup (kein JSON-Objekt).' }
  if (raw.app !== BACKUP_APP) return { ok: false, error: 'Das ist kein Backup dieser App.' }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    return { ok: false, error: 'Das Backup stammt aus einer neueren App-Version. Bitte zuerst die App aktualisieren.' }
  }
  if (!isRecord(raw.tables)) return { ok: false, error: 'Im Backup fehlen die Daten.' }

  const tables = {} as BackupFile['tables']
  const counts = {} as Record<TableName, number>
  let skipped = 0
  for (const name of TABLE_NAMES) {
    const rows = raw.tables[name]
    const valid = Array.isArray(rows)
      ? rows.filter((r): r is Record<string, unknown> => {
          const ok = isRecord(r) && typeof r.id === 'string' && r.id.length > 0
          if (!ok) skipped++
          return ok
        })
      : []
    tables[name] = valid
    counts[name] = valid.filter((r) => r.deletedAt == null).length
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return { ok: false, error: 'Das Backup ist leer.' }

  return {
    ok: true,
    backup: {
      app: BACKUP_APP,
      version: raw.version,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      tables,
    },
    counts,
    skipped,
  }
}

export function parseBackupText(text: string): BackupCheck {
  try {
    return checkBackup(JSON.parse(text))
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON.' }
  }
}

/**
 * Stellt ein Backup wieder her.
 * - replace: aktuelle Daten werden vollständig durch das Backup ersetzt
 * - merge: Einträge werden zusammengeführt, bei gleicher ID gewinnt der neuere Stand (updatedAt)
 * Gibt die Zahl geschriebener Datensätze zurück.
 */
export async function restoreBackup(backup: BackupFile, mode: RestoreMode): Promise<number> {
  let written = 0
  await db.transaction('rw', TABLE_NAMES.map((n) => db.table(n)), async () => {
    const previousSettings = await db.settings.get('app')
    for (const name of TABLE_NAMES) {
      const table = db.table(name)
      const rows = backup.tables[name] ?? []
      if (mode === 'replace') {
        await table.clear()
        await table.bulkPut(rows)
        written += rows.length
      } else {
        for (const row of rows) {
          const existing = (await table.get(row.id as string)) as Record<string, unknown> | undefined
          const incoming = typeof row.updatedAt === 'number' ? row.updatedAt : 0
          const current = existing && typeof existing.updatedAt === 'number' ? existing.updatedAt : -1
          if (!existing || incoming > current) {
            await table.put(row)
            written++
          }
        }
      }
    }
    // Ohne Einstellungen läuft die App nicht – im Zweifel die bisherigen behalten
    if (!(await db.settings.get('app')) && previousSettings) await db.settings.put(previousSettings)
  })
  return written
}

/** Löscht alle Daten und legt die Startdaten neu an. */
export async function resetAllData(): Promise<void> {
  await db.delete()
  await db.open()
}

export const TABLE_LABELS: Partial<Record<TableName, string>> = {
  habits: 'Gewohnheiten',
  habitLogs: 'Haken',
  trainingSessions: 'Trainingseinheiten',
  studyLogs: 'Lernzeiten',
  readingLogs: 'Lesezeiten',
  todos: 'To-dos',
  modules: 'Module',
  studyUnits: 'Lerneinheiten',
  projectLogs: 'Projektzeiten',
  chessLogs: 'Schachwertungen',
}
