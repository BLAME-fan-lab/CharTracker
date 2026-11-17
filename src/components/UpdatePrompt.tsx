import { RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button, IconButton } from './ui'

/** Hinweis, wenn eine neue App-Version bereitliegt. Offline-Fähigkeit wird still gemeldet. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Stündlich nach Updates schauen, solange die App offen ist
      if (registration) window.setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
    onRegisterError() {
      /* z. B. in eingebetteten Vorschauen ohne Service Worker – App funktioniert trotzdem */
    },
  })

  if (!needRefresh) return null
  return (
    <div className="pb-safe fixed inset-x-0 bottom-16 z-40 px-4 md:bottom-4 md:left-auto md:right-4 md:w-96 md:px-0">
      <div className="animate-fade flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-zinc-900 p-3 shadow-xl">
        <RefreshCw className="size-5 shrink-0 text-emerald-400" />
        <p className="flex-1 text-sm">Neue Version verfügbar.</p>
        <Button variant="primary" onClick={() => void updateServiceWorker(true)}>
          Neu laden
        </Button>
        <IconButton label="Später" onClick={() => setNeedRefresh(false)}>
          <X className="size-4" />
        </IconButton>
      </div>
    </div>
  )
}
