import type { ReactNode } from 'react'

export function ComingSoon({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-800 px-6 py-14 text-center">
      <div className="mb-3 text-zinc-500">{icon}</div>
      <h2 className="text-base font-semibold text-zinc-200">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-400">{text}</p>
    </div>
  )
}
