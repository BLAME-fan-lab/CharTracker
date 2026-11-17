import { useEffect, useState } from 'react'
import { todayStr, type DateStr } from './dates'

/** Aktuelles Datum, aktualisiert sich nach Mitternacht und beim Zurückkehren in die App. */
export function useToday(): DateStr {
  const [today, setToday] = useState(todayStr)
  useEffect(() => {
    const update = () => setToday(todayStr())
    const timer = window.setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('focus', update)
    }
  }, [])
  return today
}
