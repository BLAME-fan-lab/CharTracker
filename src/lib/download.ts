/** Datei im Browser speichern (Download). */
export function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Über das Teilen-Menü des Systems weitergeben (z. B. „In Dateien sichern“ am iPhone). */
export function canShareFiles(): boolean {
  try {
    const file = new File(['x'], 'x.json', { type: 'application/json' })
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

export async function shareText(filename: string, text: string, mime = 'application/json'): Promise<boolean> {
  try {
    const file = new File([text], filename, { type: mime })
    await navigator.share({ files: [file], title: filename })
    return true
  } catch (e) {
    // Abbruch durch den Nutzer ist kein Fehler
    if (e instanceof DOMException && e.name === 'AbortError') return false
    throw e
  }
}

/**
 * In die Zwischenablage kopieren; false, wenn der Browser es nicht erlaubt.
 * Muss direkt im Klick-Handler aufgerufen werden. Safari verlangt dafür ClipboardItem mit einem
 * Promise, wenn der Text erst asynchron entsteht.
 */
export async function copyTextLazy(getText: () => Promise<string>): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const blob = getText().then((t) => new Blob([t], { type: 'text/plain' }))
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })])
      return true
    }
    await navigator.clipboard.writeText(await getText())
    return true
  } catch {
    try {
      await navigator.clipboard.writeText(await getText())
      return true
    } catch {
      return false
    }
  }
}
