import { Card } from '../../components/ui'
import { GoalSettings, ProjectSettings } from './GoalSettings'
import { HabitSettings } from './HabitSettings'
import { TodoCategorySettings } from './TodoCategorySettings'
import { TrainingSettings } from './TrainingSettings'

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Einstellungen</h1>
      <HabitSettings />
      <TrainingSettings />
      <GoalSettings />
      <ProjectSettings />
      <TodoCategorySettings />
      <Card title="Demnächst">
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-400">
          <li>Semester, Module, Puffer und Toleranz (Phase 4)</li>
          <li>Export/Import als Backup (Phase 5)</li>
        </ul>
      </Card>
      <p className="px-1 text-xs text-zinc-500">Alle Daten liegen nur lokal in diesem Browser auf diesem Gerät.</p>
    </div>
  )
}
