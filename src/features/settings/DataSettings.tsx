import { AlertTriangle, Check, ClipboardCopy, Download, FileUp, HardDrive, Share2, Smartphone, Trash2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Button, Card, ConfirmBar } from '../../components/ui'
import { backupRepo, useSettings } from '../../data'
import type { BackupCheck, RestoreMode } from '../../data/backup'
import { cx } from '../../lib/cx'
import { canShareFiles, copyTextLazy, downloadText, shareText } from '../../lib/download'
import { requestPersistentStorage, useInstallState, usePersistentStorage } from '../../lib/pwa'

const daysAgo = (ms: number) => Math.floor((Date.now() - ms) / 86_400_000)

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 border-t border-zinc-800 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      {children}
    </div>
  )
}

export function DataSettings() {
  return (
    <Card title="Daten & App" className="scroll-mt-4">
      <div id="backup" className="space-y-4">
        <BackupSection />
        <RestoreSection />
        <InstallSection />
        <ResetSection />
        <p className="text-xs text-zinc-500">
          Version {__APP_VERSION__} · Stand {__BUILD_DATE__}. Alle Daten liegen nur lokal in diesem Browser.
        </p>
      </div>
    </Card>
  )
}

/* ---------- Backup ---------- */

function BackupSection() {
  const settings = useSettings()
  const [message, setMessage] = useState<string | null>(null)
  const [manualText, setManualText] = useState<string | null>(null)
  const last = settings?.lastBackupAt ?? null
  const shareable = canShareFiles()
  const backupText = async () => JSON.stringify(await backupRepo.createBackup())

  const done = async (text: string) => {
    await backupRepo.markBackupDone()
    setMessage(text)
  }

  const download = async () => {
    setMessage(null)
    downloadText(backupRepo.backupFileName(), await backupText())
    await done('Backup gespeichert.')
  }

  const share = async () => {
    setMessage(null)
    if (await shareText(backupRepo.backupFileName(), await backupText()).catch(() => false)) await done('Backup geteilt.')
  }

  // Kein await vor dem Kopieren: Safari erlaubt es nur direkt im Klick
  const copy = () => {
    setMessage(null)
    setManualText(null)
    void copyTextLazy(backupText).then(async (ok) => {
      if (ok) {
        await done('Backup kopiert. In der anderen App unter „Wiederherstellen → Text einfügen“ einfügen.')
      } else {
        setManualText(await backupText())
        setMessage('Automatisches Kopieren nicht erlaubt. Markiere den Text unten und kopiere ihn von Hand.')
      }
    })
  }

  return (
    <Section title="Backup">
      <p className={cx('text-sm', last == null || daysAgo(last) > 7 ? 'text-amber-300' : 'text-zinc-400')}>
        {last == null
          ? 'Noch kein Backup erstellt.'
          : daysAgo(last) === 0
            ? 'Letztes Backup: heute.'
            : `Letztes Backup: vor ${daysAgo(last)} ${daysAgo(last) === 1 ? 'Tag' : 'Tagen'}.`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void download()}>
          <Download className="size-4" /> Als Datei speichern
        </Button>
        {shareable && (
          <Button variant="secondary" onClick={() => void share()}>
            <Share2 className="size-4" /> Teilen …
          </Button>
        )}
        <Button variant="secondary" onClick={copy}>
          <ClipboardCopy className="size-4" /> Kopieren
        </Button>
      </div>
      {message && <p className={cx('text-xs', manualText ? 'text-amber-300' : 'text-emerald-300')}>{message}</p>}
      {manualText && (
        <textarea
          readOnly
          value={manualText}
          rows={4}
          onFocus={(e) => e.target.select()}
          aria-label="Backup als Text zum Kopieren"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300"
        />
      )}
      <p className="text-xs text-zinc-500">
        Enthält alles: Gewohnheiten, Zeiten, Training, To-dos, Module und Lerneinheiten. Am iPhone über „Teilen“ in der
        Dateien-App sichern.
      </p>
    </Section>
  )
}

/* ---------- Wiederherstellen ---------- */

function RestoreSection() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pasting, setPasting] = useState(false)
  const [text, setText] = useState('')
  const [check, setCheck] = useState<BackupCheck | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const load = (raw: string) => {
    setDone(null)
    setConfirmReplace(false)
    setCheck(raw.trim() ? backupRepo.parseBackupText(raw) : null)
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPasting(false)
    load(await file.text())
  }

  const restore = async (mode: RestoreMode) => {
    if (!check?.ok) return
    const n = await backupRepo.restoreBackup(check.backup, mode)
    setDone(mode === 'replace' ? 'Backup wiederhergestellt.' : `Zusammengeführt: ${n} Einträge übernommen.`)
    setCheck(null)
    setText('')
    setPasting(false)
    setConfirmReplace(false)
  }

  const summary =
    check?.ok &&
    Object.entries(backupRepo.TABLE_LABELS)
      .map(([table, label]) => [label, check.counts[table as keyof typeof check.counts]] as const)
      .filter(([, n]) => n > 0)
      .map(([label, n]) => `${n} ${label}`)
      .join(' · ')

  return (
    <Section title="Wiederherstellen">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          <FileUp className="size-4" /> Datei wählen
        </Button>
        <Button variant={pasting ? 'secondary' : 'ghost'} onClick={() => setPasting((v) => !v)}>
          <ClipboardCopy className="size-4" /> Text einfügen
        </Button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => void onFile(e)} />
      </div>
      {pasting && (
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            load(e.target.value)
          }}
          rows={4}
          placeholder="Kopiertes Backup hier einfügen …"
          aria-label="Backup als Text"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
      )}

      {check && !check.ok && (
        <p className="flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {check.error}
        </p>
      )}

      {check?.ok && (
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="text-sm">
            <div className="font-medium text-zinc-200">
              Backup
              {check.backup.exportedAt &&
                ` vom ${new Date(check.backup.exportedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`}
            </div>
            <div className="text-xs text-zinc-400">{summary}</div>
            {check.skipped > 0 && <div className="text-xs text-amber-300">{check.skipped} ungültige Einträge werden übersprungen.</div>}
          </div>
          {confirmReplace ? (
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <ConfirmBar
                text="Alle aktuellen Daten in diesem Browser werden durch das Backup ersetzt. Fortfahren?"
                confirmLabel="Ersetzen"
                danger
                onConfirm={() => void restore('replace')}
                onCancel={() => setConfirmReplace(false)}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => void restore('merge')}>
                Zusammenführen
              </Button>
              <Button variant="danger" onClick={() => setConfirmReplace(true)}>
                Alles ersetzen
              </Button>
            </div>
          )}
          <p className="text-xs text-zinc-500">
            Zusammenführen: Einträge aus beiden Ständen bleiben, bei gleichen Einträgen gewinnt der neuere. Ersetzen: Der
            Stand im Backup gilt komplett.
          </p>
        </div>
      )}
      {done && (
        <p className="flex items-center gap-2 text-sm text-emerald-300">
          <Check className="size-4" /> {done}
        </p>
      )}
    </Section>
  )
}

/* ---------- Installation & Speicher ---------- */

function InstallSection() {
  const { state, install } = useInstallState()
  const persisted = usePersistentStorage()
  const [asked, setAsked] = useState<boolean | null>(null)
  const isPersisted = asked ?? persisted

  return (
    <Section title="App & Speicher">
      <div className="flex items-start gap-2 text-sm text-zinc-300">
        <Smartphone className="mt-0.5 size-4 shrink-0 text-zinc-400" />
        <div className="space-y-2">
          {state === 'installed' && <p>Die App ist installiert und funktioniert auch offline.</p>}
          {state === 'prompt' && (
            <>
              <p>Installiere die App, dann startet sie wie eine normale App und läuft offline.</p>
              <Button variant="secondary" onClick={() => void install()}>
                App installieren
              </Button>
            </>
          )}
          {state === 'ios' && (
            <p>
              Am iPhone in Safari: <span className="text-zinc-100">Teilen</span> →{' '}
              <span className="text-zinc-100">Zum Home-Bildschirm</span>. Danach startet die App vom Homescreen und läuft
              offline.
            </p>
          )}
          {state === 'unavailable' && (
            <p className="text-zinc-400">
              Installation ist in diesem Browser nicht direkt möglich. Am Handy über das Browser-Menü „Zum
              Startbildschirm hinzufügen“.
            </p>
          )}
        </div>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <HardDrive className="mt-0.5 size-4 shrink-0 text-zinc-400" />
        <div className="space-y-2">
          <p className={isPersisted ? 'text-zinc-300' : 'text-amber-300'}>
            {isPersisted == null
              ? 'Speicherstatus wird geprüft …'
              : isPersisted
                ? 'Dauerhafter Speicher aktiv: Der Browser löscht die Daten nicht von selbst.'
                : 'Speicher nicht dauerhaft: Der Browser darf die Daten bei Platzmangel löschen. Installieren und regelmäßig Backups machen.'}
          </p>
          {isPersisted === false && (
            <Button variant="ghost" onClick={() => void requestPersistentStorage().then(setAsked)}>
              Dauerhaft speichern anfragen
            </Button>
          )}
        </div>
      </div>
    </Section>
  )
}

/* ---------- Zurücksetzen ---------- */

function ResetSection() {
  const [confirming, setConfirming] = useState(false)
  return (
    <Section title="Neu anfangen">
      {confirming ? (
        <div className="overflow-hidden rounded-lg border border-rose-500/30">
          <ConfirmBar
            text="Wirklich alle Daten löschen? Das lässt sich nicht rückgängig machen – mach vorher ein Backup."
            confirmLabel="Alles löschen"
            danger
            onConfirm={() => void backupRepo.resetAllData().then(() => window.location.reload())}
            onCancel={() => setConfirming(false)}
          />
        </div>
      ) : (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          <Trash2 className="size-4" /> Alle Daten löschen
        </Button>
      )}
      <p className="text-xs text-zinc-500">Setzt die App auf die Startdaten zurück (Gewohnheiten, Module, Semester).</p>
    </Section>
  )
}
