import { ChevronRight, GraduationCap, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button, Card, SegmentedControl, Spinner } from '../../components/ui'
import { sortModules, type UniSort } from '../../domain/uni'
import { cx } from '../../lib/cx'
import { diffDays, fmt } from '../../lib/dates'
import { formatHM } from '../../lib/duration'
import { useParamSheet } from '../../lib/useParamSheet'
import { useToday } from '../../lib/useToday'
import { examText, formatPerWeek, pct } from './format'
import { ImportSheet } from './ImportSheet'
import { useUniData, type ModuleView } from './useUniData'
import { IstSollBar, StatusPill } from './UniParts'

const SORT_KEY = 'uni.sort'

export function UniPage() {
  const today = useToday()
  const data = useUniData(today)
  const importSheet = useParamSheet('import')
  const [sort, setSort] = useState<UniSort>(() => {
    try {
      return localStorage.getItem(SORT_KEY) === 'exam' ? 'exam' : 'backlog'
    } catch {
      return 'backlog'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sort)
    } catch {
      /* egal */
    }
  }, [sort])

  if (data === undefined) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Uni</h1>
        <Spinner />
      </div>
    )
  }
  if (data === null) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Uni</h1>
        <p className="text-sm text-zinc-400">Kein Semester angelegt.</p>
      </div>
    )
  }

  const { semester, modules, overall } = data
  const sorted = sortModules(modules, sort)
  const daysToTarget = diffDays(semester.targetDate, today)
  const counts = {
    behind: modules.filter((m) => m.progress.status === 'behind').length,
    onTrack: modules.filter((m) => m.progress.status === 'on_track').length,
    ahead: modules.filter((m) => ['ahead', 'done'].includes(m.progress.status)).length,
  }
  const weekMinutes = modules.reduce((a, m) => a + m.studyMinutesWeek, 0)
  const semesterMinutes = modules.reduce((a, m) => a + m.studyMinutes, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Uni</h1>
          <p className="text-xs text-zinc-400">
            {semester.name} · alles fertig bis {fmt(semester.targetDate, 'd. MMMM')}
            {daysToTarget > 0 && ` (noch ${daysToTarget} Tage)`}
          </p>
        </div>
        <Button variant="secondary" onClick={() => importSheet.open('1')}>
          <Upload className="size-4" /> Importieren
        </Button>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-zinc-400">Gesamt (alle Einheiten)</div>
            <div className="mt-0.5 text-2xl font-semibold tabular-nums">
              {pct(overall.ist)} <span className="text-base font-normal text-zinc-500">/ Soll {pct(overall.soll)}</span>
            </div>
            <div className="text-xs text-zinc-500 tabular-nums">
              {overall.done}/{overall.total} Einheiten erledigt
            </div>
          </div>
          <div className="text-right text-xs leading-relaxed">
            {counts.behind > 0 && <div className="text-rose-300">{counts.behind} hinterher</div>}
            {counts.onTrack > 0 && <div className="text-sky-300">{counts.onTrack} im Plan</div>}
            {counts.ahead > 0 && <div className="text-emerald-300">{counts.ahead} voraus</div>}
          </div>
        </div>
        {overall.total > 0 && (
          <div className="relative mt-3 pt-1">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(overall.ist ?? 0) * 100}%` }} />
            </div>
            <div
              className="absolute top-0 bottom-[-4px] w-0.5 -translate-x-1/2 rounded-full bg-zinc-100"
              style={{ left: `${Math.max(0.5, Math.min(99.5, (overall.soll ?? 0) * 100))}%` }}
              aria-hidden="true"
            />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
          <span>
            Gelernt diese Woche <span className="font-medium text-zinc-200 tabular-nums">{formatHM(weekMinutes)} h</span>
          </span>
          <span>
            im Semester <span className="font-medium text-zinc-200 tabular-nums">{formatHM(semesterMinutes)} h</span>
          </span>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-300">Module</h2>
        <SegmentedControl
          value={sort}
          onChange={setSort}
          options={[
            { value: 'backlog', label: 'Rückstand' },
            { value: 'exam', label: 'Klausur' },
          ]}
        />
      </div>

      <div className="space-y-3">
        {sorted.map((m) => (
          <ModuleCard key={m.module.id} view={m} />
        ))}
      </div>

      {importSheet.value && (
        <ImportSheet modules={modules.map((m) => m.module)} today={today} onClose={importSheet.close} />
      )}

      <p className="px-1 text-xs leading-relaxed text-zinc-500">
        Der weiße Strich zeigt das Soll von heute: linear ab Vorlesungsbeginn ({fmt(semester.lectureStart, 'dd.MM.')}) bis
        zum Zieldatum. Das ist der {fmt(semester.targetDate, 'dd.MM.')} oder {data.config.bufferDays} Tage vor der Klausur,
        je nachdem, was früher liegt. Im Plan heißt höchstens ±{data.config.tolerancePp} Prozentpunkte Abweichung.
        {data.config.pauseInBreaks && ' In Semesterpausen steht das Soll still.'}
      </p>
    </div>
  )
}

function ModuleCard({ view }: { view: ModuleView }) {
  const { module: m, progress: p } = view
  const perWeek = formatPerWeek(p)
  return (
    <Link
      to={`/uni/${m.id}`}
      className={cx(
        'block rounded-2xl border bg-zinc-900/60 p-3 transition-colors hover:border-zinc-700 sm:p-4',
        p.status === 'behind' ? 'border-rose-500/30' : 'border-zinc-800/80',
        p.examPassed && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 shrink-0 text-violet-400" />
            <span className="truncate font-semibold">{m.shortName || m.name}</span>
          </div>
          {m.shortName && m.shortName !== m.name && <div className="truncate pl-6 text-xs text-zinc-500">{m.name}</div>}
        </div>
        <div className="flex items-center gap-1">
          <StatusPill progress={p} />
          <ChevronRight className="size-4 text-zinc-600" />
        </div>
      </div>

      {p.total > 0 ? (
        <>
          <div className="mt-3">
            <IstSollBar progress={p} />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 text-xs tabular-nums">
            <span className="text-zinc-300">
              Ist <span className="font-semibold">{pct(p.ist)}</span>
              <span className="text-zinc-500"> · Soll {pct(p.soll)}</span>
            </span>
            <span className="text-zinc-400">
              {p.done}/{p.total} Einheiten
            </span>
          </div>
        </>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Noch keine Lerneinheiten. Tippe hier, um Kapitel, Blätter usw. anzulegen.</p>
      )}

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
        <span className={cx(p.daysToExam != null && p.daysToExam >= 0 && p.daysToExam <= 14 && 'font-medium text-amber-300')}>
          {examText(p, m.examTime)}
        </span>
        {perWeek && <span className={cx(p.status === 'behind' && 'text-rose-300')}>{perWeek} nötig</span>}
        {view.studyMinutes > 0 && <span className="tabular-nums">{formatHM(view.studyMinutes)} h gelernt</span>}
      </div>
    </Link>
  )
}
