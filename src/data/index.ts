/**
 * Öffentliche Datenschicht. Die Oberfläche importiert ausschließlich von hier –
 * niemals direkt `db` oder Dexie. So kann die Speicherung (z. B. Sync mit Supabase)
 * ausgetauscht oder ergänzt werden, ohne die UI anzufassen.
 */
export * from './types'
export * from './hooks'
export * as habitsRepo from './repo/habits'
export * as settingsRepo from './repo/settings'
export * as trainingRepo from './repo/training'
export * as goalsRepo from './repo/goals'
export * as projectsRepo from './repo/projects'
export * as uniRepo from './repo/uni'

import { db } from './db'

/** Öffnet die lokale Datenbank (legt beim ersten Start die Startdaten an). */
export async function openDatabase(): Promise<void> {
  await db.open()
}
