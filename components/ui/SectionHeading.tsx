import type { ReactNode } from 'react'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  align?: 'left' | 'center'
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left'

  return (
    <div className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">{eyebrow}</p>}
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className={align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'}>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-slate-100">{title}</h2>
          {description && <p className="mt-2 text-base leading-7 text-gray-600 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  )
}
