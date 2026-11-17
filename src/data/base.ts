import type { BaseRecord } from './types'

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback für unsichere Kontexte (z. B. http://192.168.x.x im Heimnetz)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/** Neuer Datensatz mit Metadaten. */
export function created<T extends object>(data: T, id: string = newId()): T & BaseRecord {
  const now = Date.now()
  return { ...data, id, createdAt: now, updatedAt: now, deletedAt: null }
}

/** Änderung mit aktualisiertem Zeitstempel. */
export function changed<T extends object>(patch: T): T & { updatedAt: number } {
  return { ...patch, updatedAt: Date.now() }
}

export const alive = <T extends BaseRecord>(r: T): boolean => r.deletedAt == null

export const byOrder = <T extends { order: number }>(a: T, b: T): number => a.order - b.order
