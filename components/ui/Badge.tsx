import { Star } from 'lucide-react'

type Role = 'student' | 'mentor' | 'admin'

interface RoleBadgeProps {
  kind: 'role'
  role: Role
}

interface PointsBadgeProps {
  kind: 'points'
  points: number
}

type BadgeProps = RoleBadgeProps | PointsBadgeProps

const roleStyles: Record<Role, string> = {
  student: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-900',
  mentor: 'bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-300 dark:ring-indigo-900',
  admin: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
}

const roleLabels: Record<Role, string> = {
  student: 'Siswa',
  mentor: 'Mentor',
  admin: 'Admin',
}

export function Badge(props: BadgeProps) {
  if (props.kind === 'points') {
    return (
      <span className="inline-flex min-h-7 items-center gap-1 rounded-full bg-amber-100 px-3 text-xs font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:ring-amber-800">
        <Star className="size-3.5" aria-hidden="true" />
        {props.points} poin
      </span>
    )
  }

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold ring-1 ${roleStyles[props.role]}`}>
      {roleLabels[props.role]}
    </span>
  )
}
