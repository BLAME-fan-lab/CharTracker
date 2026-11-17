import { ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useSettings } from '../../data'
import { diffDays, toDateStr, type DateStr } from '../../lib/dates'

const REMIND_AFTER_DAYS = 7

/** Hinweis in der Wochenansicht, wenn länger kein Backup gemacht wurde. */
export function BackupReminder({ today }: { today: DateStr }) {
  const settings = useSettings()
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('backupReminderHidden') === '1'
    } catch {
      return false
    }
  })
  if (!settings || hidden) return null

  const last = settings.lastBackupAt ?? null
  const usedForDays = diffDays(today, settings.trackingStart)
  const days = last == null ? null : diffDays(today, toDateStr(new Date(last)))
  // Erst ab ein paar Tagen Nutzung erinnern, dann alle 7 Tage
  if (last == null ? usedForDays < 3 : days! < REMIND_AFTER_DAYS) return null

  const hide = () => {
    setHidden(true)
    try {
      sessionStorage.setItem('backupReminderHidden', '1')
    } catch {
      /* egal */
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
      <ShieldAlert className="size-4 shrink-0 text-amber-300" />
      <p className="flex-1 text-amber-100">
        {last == null ? 'Du hast noch kein Backup gemacht.' : `Letztes Backup vor ${days} Tagen.`}{' '}
        <Link to="/einstellungen?bereich=backup" className="font-medium text-amber-300 underline underline-offset-2">
          Jetzt sichern
        </Link>
      </p>
      <button type="button" onClick={hide} aria-label="Hinweis ausblenden" className="text-amber-300/70 hover:text-amber-200">
        <X className="size-4" />
      </button>
    </div>
  )
}
