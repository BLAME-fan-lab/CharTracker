import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

/**
 * Ein Overlay (Sheet/Panel), das an einem URL-Parameter hängt, z. B. ?tag=2026-11-17 oder ?todo=neu.
 * So schließt die Zurück-Geste am Handy das Overlay, statt die Seite zu verlassen.
 */
export function useParamSheet(param: string) {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const value = params.get(param)
  const stateKey = `sheet_${param}`

  const open = useCallback(
    (v: string) => {
      const next = new URLSearchParams(params)
      next.set(param, v)
      setParams(next, { state: { ...(location.state as object | null), [stateKey]: true } })
    },
    [params, setParams, param, stateKey, location.state],
  )

  /** Anderen Wert im offenen Overlay zeigen (ohne neuen Verlaufseintrag). */
  const show = useCallback(
    (v: string) => {
      const next = new URLSearchParams(params)
      next.set(param, v)
      setParams(next, { replace: true, state: location.state })
    },
    [params, setParams, param, location.state],
  )

  const close = useCallback(() => {
    if ((location.state as Record<string, boolean> | null)?.[stateKey]) {
      navigate(-1)
    } else {
      const next = new URLSearchParams(params)
      next.delete(param)
      setParams(next, { replace: true })
    }
  }, [location.state, stateKey, navigate, params, setParams, param])

  return { value, open, show, close }
}
