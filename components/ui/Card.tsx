import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle' | 'interactive'
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const variantStyles = {
  default: 'border border-gray-100 bg-white shadow-[var(--shadow-card)] dark:bg-slate-900 dark:border-slate-800 dark:shadow-none',
  subtle: 'border border-blue-100 bg-blue-50/50 dark:bg-slate-800/60 dark:border-slate-700',
  interactive: 'border border-gray-100 bg-white shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-raised)] dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700',
}

export function Card({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <div className={`rounded-2xl ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
