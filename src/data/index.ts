/**
 * Öffentliche Datenschicht. Die Oberfläche importiert ausschließlich von hier –
 * niemals direkt `db` oder Dexie. So kann die Speicherung (z. B. Sync mit Supabase)
 * ausgetauscht oder ergänzt werden, ohne die UI anzufassen.
 */
export * from './types'
export * from './hooks'
export * as habitsRepo from './repo/habits'
export * as settingsRepo from './repo/settings'

import { db } from './db'

/** Öffnet die lokale Datenbank (legt beim ersten Start die Startdaten an). */
export async function openDatabase(): Promise<void> {
  await db.open()
}
