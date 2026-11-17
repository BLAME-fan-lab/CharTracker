import { changed } from '../base'
import { db } from '../db'
import type { AppSettings, BaseRecord } from '../types'

export async function getSettings(): Promise<AppSettings | undefined> {
  return db.settings.get('app')
}

export async function updateSettings(patch: Partial<Omit<AppSettings, keyof BaseRecord>>): Promise<void> {
  await db.settings.update('app', changed(patch))
}
