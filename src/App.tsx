import { GraduationCap } from 'lucide-react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { AppShell } from './components/AppShell'
import { ComingSoon } from './components/ComingSoon'
import { MonthPage } from './features/month/MonthPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TodosPage } from './features/todos/TodosPage'
import { WeekPage } from './features/week/WeekPage'

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/woche" replace /> },
      { path: 'woche', element: <WeekPage /> },
      { path: 'monat', element: <MonthPage /> },
      { path: 'todos', element: <TodosPage /> },
      {
        path: 'uni',
        element: (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Uni</h1>
            <ComingSoon
              icon={<GraduationCap className="size-8" />}
              title="Uni-Fortschritt"
              text="Module, Lerneinheiten und Soll/Ist-Vergleich – kommt in Phase 4."
            />
          </div>
        ),
      },
      { path: 'einstellungen', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/woche" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
