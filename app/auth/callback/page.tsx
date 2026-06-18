'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const selectedRole = params.get('role') || 'student'
      const mode = params.get('mode') || 'register'

      // 1. Dapatkan session dari URL (hash/query)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Callback error:', error)
        router.push('/login?error=auth_failed')
        return
      }

      if (session?.user) {
        const userId = session.user.id
        
        // 2. CEK APAKAH USER SUDAH PUNYA PROFIL DI DATABASE
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single()

        // 3. LOGIKA BLOKIR: Jika mode LOGIN tapi profil TIDAK ADA
        if (mode === 'login' && (!profile || fetchError)) {
          console.warn('Login denied: Profile not found for UID', userId)
          // Hapus session agar tidak dianggap login oleh middleware
          await supabase.auth.signOut()
          // Redirect ke register dengan pesan error
          router.push('/register?error=account_not_found&t=' + Date.now())
          return
        }

        // 4. LOGIKA DAFTAR/UPDATE: Jika mode REGISTER atau user sudah punya profil
        const userRole = profile?.role || session.user.user_metadata?.role || selectedRole

        // Update metadata auth jika perlu
        if (!session.user.user_metadata?.role) {
          await supabase.auth.updateUser({
            data: { role: userRole }
          })
        }

        // Pastikan tabel profiles tersinkronisasi
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          role: userRole,
          updated_at: new Date().toISOString()
        })

        // Redirect ke dashboard
        const target = userRole === 'mentor' ? '/dashboard/mentor' : 
                     userRole === 'admin' ? '/admin/dashboard' : '/dashboard/student'
        router.push(target)
      } else {
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 font-medium">Sedang memproses login...</p>
      </div>
    </div>
  )
}
