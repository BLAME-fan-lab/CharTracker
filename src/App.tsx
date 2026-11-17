import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { AppShell } from './components/AppShell'
import { MonthPage } from './features/month/MonthPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TodosPage } from './features/todos/TodosPage'
import { ModulePage } from './features/uni/ModulePage'
import { UniPage } from './features/uni/UniPage'
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
      { path: 'uni', element: <UniPage /> },
      { path: 'uni/:moduleId', element: <ModulePage /> },
      { path: 'einstellungen', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/woche" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
