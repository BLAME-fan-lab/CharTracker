import { isValidDateStr, type DateStr } from '../../lib/dates'
import { useParamSheet } from '../../lib/useParamSheet'

/** Das Tages-Panel hängt am URL-Parameter ?tag=YYYY-MM-DD. */
export function useDayPanel() {
  const { value, open, show, close } = useParamSheet('tag')
  const day: DateStr | null = isValidDateStr(value) ? value : null
  return { day, open, show, close }
}
