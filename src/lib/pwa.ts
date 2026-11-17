import { useEffect, useState } from 'react'

/*
 * Installation und dauerhafter Speicher.
 * Das Ereignis „beforeinstallprompt“ (Chrome/Edge/Android) kommt sehr früh,
 * deshalb wird es beim Start abgefangen und hier zwischengespeichert.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export const isIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Installations-Möglichkeit: 'prompt' (Knopf möglich), 'ios' (Anleitung), 'installed', 'unavailable'. */
export function useInstallState(): { state: 'prompt' | 'ios' | 'installed' | 'unavailable'; install: () => Promise<void> } {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    notify()
  }
  if (isStandalone()) return { state: 'installed', install }
  if (deferredPrompt) return { state: 'prompt', install }
  if (isIOS()) return { state: 'ios', install }
  return { state: 'unavailable', install }
}

/** Bittet den Browser, die Daten nicht automatisch zu löschen (best effort). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export function usePersistentStorage(): boolean | null {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  useEffect(() => {
    let alive = true
    const check = async () => {
      try {
        const p = navigator.storage?.persisted ? await navigator.storage.persisted() : false
        if (alive) setPersisted(p)
      } catch {
        if (alive) setPersisted(false)
      }
    }
    void check()
    return () => {
      alive = false
    }
  }, [])
  return persisted
}
