import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 px-6 py-10 text-center sm:px-10 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-400" aria-hidden="true">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <h3 className="mt-5 text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-slate-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
