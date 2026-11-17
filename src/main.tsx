import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { openDatabase } from './data'
import './index.css'

const root = createRoot(document.getElementById('root')!)

openDatabase()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
  .catch((error: unknown) => {
    console.error(error)
    root.render(
      <div className="mx-auto max-w-md p-6 text-sm text-zinc-300">
        <h1 className="mb-2 text-lg font-semibold text-rose-300">Lokaler Speicher nicht verfügbar</h1>
        <p>
          Die App konnte ihre Datenbank (IndexedDB) nicht öffnen. Das passiert z. B. im privaten Modus mancher Browser.
          Bitte öffne die App in einem normalen Browserfenster.
        </p>
        <pre className="mt-4 overflow-auto rounded bg-zinc-900 p-3 text-xs text-zinc-500">{String(error)}</pre>
      </div>,
    )
  })
