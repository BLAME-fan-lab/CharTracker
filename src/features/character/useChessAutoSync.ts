import { useEffect, useRef } from 'react'
import { characterRepo, useChessLogs, useProfile } from '../../data'
import { isChessUsername } from '../../domain/chess'
import { fetchChessCom } from '../../lib/chesscom'
import type { DateStr } from '../../lib/dates'

/** Holt einmal am Tag still die aktuellen chess.com-Wertungen, wenn ein Benutzername hinterlegt ist */
export function useChessAutoSync(today: DateStr) {
  const profile = useProfile()
  const logs = useChessLogs()
  const tried = useRef<string | null>(null)

  useEffect(() => {
    const name = profile?.chessUsername
    if (!name || !logs || !isChessUsername(name)) return
    if (tried.current === today) return
    const hasToday = logs.some((l) => l.date === today && l.source === 'chesscom')
    if (hasToday || (typeof navigator !== 'undefined' && !navigator.onLine)) return
    tried.current = today
    fetchChessCom(name)
      .then((v) => characterRepo.saveChessLog(today, { ...v, source: 'chesscom' }))
      .catch(() => {
        // still: beim nächsten Öffnen der Seite (nächster Tag) erneut versuchen
      })
  }, [profile?.chessUsername, logs, today])
}
