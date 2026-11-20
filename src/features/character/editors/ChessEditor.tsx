import { ExternalLink, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Spinner, TextInput } from '../../../components/ui'
import { characterRepo, useChessLogs, useProfile } from '../../../data'
import { chessComProfileUrl, effectiveRating, isChessUsername } from '../../../domain/chess'
import { ChessComError, fetchChessCom } from '../../../lib/chesscom'
import { fmt, type DateStr } from '../../../lib/dates'
import { cx } from '../../../lib/cx'

const num = (s: string) => {
  const n = Number(s.trim())
  return s.trim() && Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

export function ChessEditor({ today }: { today: DateStr }) {
  const profile = useProfile()
  const logs = useChessLogs()
  const [name, setName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [manual, setManual] = useState({ rapid: '', blitz: '', daily: '', puzzle: '', games: '' })

  if (!profile || !logs) return <Spinner />
  const saved = profile.chessUsername ?? ''
  const value = name ?? saved

  const sync = async (username: string) => {
    if (!isChessUsername(username)) {
      setMsg({ ok: false, text: 'Bitte einen gültigen chess.com-Benutzernamen eingeben.' })
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const v = await fetchChessCom(username)
      await characterRepo.updateProfile({ chessUsername: username.trim() })
      await characterRepo.saveChessLog(today, { ...v, source: 'chesscom' })
      const eff = effectiveRating(v)
      setMsg({ ok: true, text: eff.rating ? `Geladen: ${eff.from} ${eff.rating}, ${v.games} Partien.` : 'Verbunden, aber noch keine gewerteten Partien.' })
      setName(null)
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ChessComError ? e.message : 'Laden fehlgeschlagen.' })
    } finally {
      setBusy(false)
    }
  }

  const saveManual = async () => {
    const values = { rapid: num(manual.rapid), blitz: num(manual.blitz), daily: num(manual.daily), puzzle: num(manual.puzzle) }
    if (!values.rapid && !values.blitz && !values.daily && !values.puzzle) {
      setMsg({ ok: false, text: 'Mindestens eine Wertung eintragen.' })
      return
    }
    await characterRepo.saveChessLog(today, { ...values, bullet: null, games: num(manual.games) ?? 0, lastPlayed: today, source: 'manual' })
    setManual({ rapid: '', blitz: '', daily: '', puzzle: '', games: '' })
    setMsg({ ok: true, text: 'Wertung gespeichert.' })
  }

  const history = [...logs].reverse().slice(0, 10)

  return (
    <>
      <Card title="chess.com">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void sync(value)
          }}
        >
          <TextInput
            value={value}
            onChange={(e) => setName(e.target.value)}
            placeholder="Benutzername"
            aria-label="chess.com-Benutzername"
            autoComplete="off"
            className="min-w-[12rem] flex-1"
          />
          <Button type="submit" variant="primary" disabled={busy || !value.trim()}>
            {busy ? <Spinner /> : <RefreshCw className="size-4" />}
            {saved && value.trim() === saved ? 'Aktualisieren' : 'Verbinden'}
          </Button>
        </form>
        {msg && <p className={cx('mt-2 text-xs', msg.ok ? 'text-emerald-300' : 'text-rose-300')}>{msg.text}</p>}
        <p className="mt-2 text-xs text-zinc-500">
          Die App holt deine öffentlichen Wertungen direkt bei chess.com, ohne Passwort, und gleicht sie einmal am Tag automatisch ab, wenn du den
          Charakter öffnest.
          {saved && (
            <>
              {' '}
              <a href={chessComProfileUrl(saved)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-lime-300 underline underline-offset-2">
                Profil von {saved} <ExternalLink className="size-3" />
              </a>
            </>
          )}
        </p>
      </Card>

      <Card title="Von Hand eintragen">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(
            [
              ['rapid', 'Rapid'],
              ['blitz', 'Blitz'],
              ['daily', 'Daily'],
              ['puzzle', 'Puzzles'],
              ['games', 'Partien'],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="text-xs text-zinc-400">
              {label}
              <TextInput
                inputMode="numeric"
                value={manual[k]}
                onChange={(e) => setManual((m) => ({ ...m, [k]: e.target.value }))}
                className="mt-1 w-full"
              />
            </label>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">Für Lichess, Vereinsturniere oder wenn du offline bist.</p>
          <Button onClick={() => void saveManual()}>Eintragen</Button>
        </div>
      </Card>

      {history.length > 0 && (
        <Card title="Verlauf">
          <ul className="space-y-1 text-sm">
            {history.map((l, i) => {
              const eff = effectiveRating(l)
              const prev = history[i + 1] ? effectiveRating(history[i + 1]).rating : null
              const delta = prev != null && eff.rating && prev ? eff.rating - prev : null
              return (
                <li key={l.id} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-zinc-500">{fmt(l.date, 'd. MMM yyyy')}</span>
                  <span className="tabular-nums">{eff.rating || '–'}</span>
                  <span className="text-xs text-zinc-500">{eff.from}</span>
                  {delta != null && delta !== 0 && (
                    <span className={cx('text-xs tabular-nums', delta > 0 ? 'text-emerald-300' : 'text-rose-300')}>
                      {delta > 0 ? '+' : ''}
                      {delta}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-zinc-600">{l.source === 'chesscom' ? 'chess.com' : 'von Hand'}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </>
  )
}
