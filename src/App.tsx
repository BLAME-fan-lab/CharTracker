import { createHashRouter, Navigate, RouterProvider } from 'react-router'
import { AppShell } from './components/AppShell'
import { WeekPage } from './features/week/WeekPage'

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/woche" replace /> },
      { path: 'woche', element: <WeekPage /> },
      // Seltener genutzte Seiten werden erst beim Aufruf geladen (offline trotzdem verfügbar, da vorab gecacht)
      { path: 'monat', lazy: () => import('./features/month/MonthPage').then((m) => ({ Component: m.MonthPage })) },
      { path: 'todos', lazy: () => import('./features/todos/TodosPage').then((m) => ({ Component: m.TodosPage })) },
      { path: 'uni', lazy: () => import('./features/uni/UniPage').then((m) => ({ Component: m.UniPage })) },
      {
        path: 'uni/:moduleId',
        lazy: () => import('./features/uni/ModulePage').then((m) => ({ Component: m.ModulePage })),
      },
      {
        path: 'charakter',
        lazy: () => import('./features/character/CharacterPage').then((m) => ({ Component: m.CharacterPage })),
      },
      {
        path: 'charakter/:skill',
        lazy: () => import('./features/character/SkillPage').then((m) => ({ Component: m.SkillPage })),
      },
      {
        path: 'einstellungen',
        lazy: () => import('./features/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
      },
      { path: '*', element: <Navigate to="/woche" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
