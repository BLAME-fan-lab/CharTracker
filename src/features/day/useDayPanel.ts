import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { isValidDateStr, type DateStr } from '../../lib/dates'

const PARAM = 'tag'

/**
 * Das Tages-Panel hängt am URL-Parameter ?tag=YYYY-MM-DD.
 * So schließt die Zurück-Geste am Handy das Panel, statt die Seite zu verlassen.
 */
export function useDayPanel() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const raw = params.get(PARAM)
  const day: DateStr | null = isValidDateStr(raw) ? raw : null

  const open = useCallback(
    (date: DateStr) => {
      const next = new URLSearchParams(params)
      next.set(PARAM, date)
      setParams(next, { state: { dayPanel: true } })
    },
    [params, setParams],
  )

  /** Anderen Tag im offenen Panel zeigen (ohne neuen Verlaufseintrag). */
  const show = useCallback(
    (date: DateStr) => {
      const next = new URLSearchParams(params)
      next.set(PARAM, date)
      setParams(next, { replace: true, state: location.state })
    },
    [params, setParams, location.state],
  )

  const close = useCallback(() => {
    if ((location.state as { dayPanel?: boolean } | null)?.dayPanel) {
      navigate(-1)
    } else {
      const next = new URLSearchParams(params)
      next.delete(PARAM)
      setParams(next, { replace: true })
    }
  }, [location.state, navigate, params, setParams])

  return { day, open, show, close }
}
