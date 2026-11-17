import { Card } from '../../components/ui'
import { HabitSettings } from './HabitSettings'

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Einstellungen</h1>
      <HabitSettings />
      <Card title="Demnächst">
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-400">
          <li>Trainingsplan und Wochenziele (Phase 2)</li>
          <li>To-do-Kategorien (Phase 3)</li>
          <li>Semester, Module, Puffer und Toleranz (Phase 4)</li>
          <li>Export/Import als Backup (Phase 5)</li>
        </ul>
      </Card>
      <p className="px-1 text-xs text-zinc-500">
        Alle Daten liegen nur lokal in diesem Browser auf diesem Gerät.
      </p>
    </div>
  )
}
