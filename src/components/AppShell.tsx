import { CalendarDays, GraduationCap, ListTodo, Settings, Swords } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { DayPanel } from '../features/day/DayPanel'
import { ProgressCelebration } from './ProgressCelebration'
import { UpdatePrompt } from './UpdatePrompt'
import { cx } from '../lib/cx'

const NAV: { to: string; label: string; icon: ReactNode; match?: string[] }[] = [
  { to: '/woche', label: 'Übersicht', icon: <CalendarDays className="size-5" />, match: ['/woche', '/monat'] },
  { to: '/todos', label: 'To-dos', icon: <ListTodo className="size-5" /> },
  { to: '/uni', label: 'Uni', icon: <GraduationCap className="size-5" /> },
  { to: '/charakter', label: 'Charakter', icon: <Swords className="size-5" /> },
  { to: '/einstellungen', label: 'Einstellungen', icon: <Settings className="size-5" /> },
]

export function AppShell() {
  const { pathname } = useLocation()
  const isActive = (item: (typeof NAV)[number]) =>
    (item.match ?? [item.to]).some((p) => pathname === p || pathname.startsWith(`${p}/`))

  return (
    <div className="min-h-dvh md:flex">
      {/* Laptop: Seitenleiste */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-zinc-800/80 px-3 py-5 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2 text-base font-bold">
          <img src="./favicon.svg" alt="" className="size-7" />
          Tracker
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={cx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive(item) ? 'bg-zinc-800 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="pt-safe min-w-0 flex-1">
        <div className="mx-auto max-w-3xl px-4 pt-4 pb-28 md:px-8 md:pt-8 md:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Handy: Leiste unten */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={cx(
                'flex min-w-0 flex-col items-center gap-0.5 py-2 text-[10.5px] transition-colors',
                isActive(item) ? 'text-emerald-400' : 'text-zinc-400',
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <DayPanel />
      <UpdatePrompt />
      <ProgressCelebration />
    </div>
  )
}
