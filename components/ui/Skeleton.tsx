interface SkeletonProps {
  className?: string
  variant?: 'line' | 'circle' | 'card'
}

const variantStyles = {
  line: 'h-4 w-full rounded-full',
  circle: 'size-12 rounded-full',
  card: 'h-48 w-full rounded-2xl',
}

export function Skeleton({ className = '', variant = 'line' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-slate-800 ${variantStyles[variant]} ${className}`}
      role="status"
      aria-label="Memuat konten"
    />
  )
}
