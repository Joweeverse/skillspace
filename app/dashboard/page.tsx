'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/authService'

export default function DashboardIndexPage() {
  const router = useRouter()

  useEffect(() => {
    async function redirectByRole() {
      const session = await AuthService.getSession()
      if (!session?.user) {
        router.replace('/login')
        return
      }

      try {
        const profile = await AuthService.getUserProfile(session.user.id)
        const role = profile?.role || session.user.user_metadata?.role
        if (role === 'mentor') {
          router.replace('/dashboard/mentor')
        } else if (role === 'admin') {
          router.replace('/admin/dashboard')
        } else {
          router.replace('/dashboard/student')
        }
      } catch {
        const fallbackRole = session.user.user_metadata?.role
        if (fallbackRole === 'mentor') {
          router.replace('/dashboard/mentor')
        } else if (fallbackRole === 'admin') {
          router.replace('/admin/dashboard')
        } else {
          router.replace('/dashboard/student')
        }
      }
    }

    redirectByRole()
  }, [router])

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-500 dark:text-slate-400">Memuat dashboard...</p>
      </div>
    </div>
  )
}
