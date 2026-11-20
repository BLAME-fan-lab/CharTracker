import { parseChessComStats, type ChessValues } from '../domain/chess'

export class ChessComError extends Error {
  readonly kind: 'not-found' | 'offline' | 'other'
  constructor(message: string, kind: 'not-found' | 'offline' | 'other') {
    super(message)
    this.kind = kind
  }
}

/** Öffentliche Wertungen eines chess.com-Spielers laden (ohne Login, die Schnittstelle erlaubt Browser-Abrufe) */
export async function fetchChessCom(username: string): Promise<ChessValues> {
  const name = username.trim().toLowerCase()
  let res: Response
  try {
    res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(name)}/stats`, { headers: { Accept: 'application/json' } })
  } catch {
    throw new ChessComError('chess.com ist gerade nicht erreichbar. Bist du online?', 'offline')
  }
  if (res.status === 404) throw new ChessComError(`Spieler „${username.trim()}“ gibt es bei chess.com nicht.`, 'not-found')
  if (!res.ok) throw new ChessComError(`chess.com antwortet mit Fehler ${res.status}.`, 'other')
  return parseChessComStats(await res.json())
}
