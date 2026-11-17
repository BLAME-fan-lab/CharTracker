import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { DataSettings } from './DataSettings'
import { GoalSettings, ProjectSettings } from './GoalSettings'
import { HabitSettings } from './HabitSettings'
import { TodoCategorySettings } from './TodoCategorySettings'
import { TrainingSettings } from './TrainingSettings'
import { UniSettings } from './UniSettings'

export function SettingsPage() {
  const [params] = useSearchParams()
  const section = params.get('bereich')
  // Direktsprung, z. B. aus der Backup-Erinnerung
  useEffect(() => {
    if (!section) return
    // Mehrfach scrollen: Die Karten darüber laden nach und verschieben das Ziel
    const scroll = () => document.getElementById(section)?.scrollIntoView({ block: 'start' })
    const timers = [100, 400, 900].map((ms) => window.setTimeout(scroll, ms))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [section])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Einstellungen</h1>
      <HabitSettings />
      <TrainingSettings />
      <GoalSettings />
      <ProjectSettings />
      <TodoCategorySettings />
      <UniSettings />
      <DataSettings />
    </div>
  )
}
