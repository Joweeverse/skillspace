'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/authService'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { ImageSlot } from '@/components/ui/ImageSlot'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await AuthService.signInWithGoogle('student', 'login')
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 dark:shadow-none border border-gray-100 dark:border-slate-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 dark:bg-blue-950/30 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-50 dark:bg-indigo-950/30 rounded-full blur-3xl opacity-50" />

        {/* Visual Illustration */}
        <div className="w-48 mx-auto relative z-10">
          <ImageSlot
            src="/illustrations/auth-login.svg"
            alt="Ilustrasi masuk akun belajar SkillSpace"
            aspectRatio="16/9"
            priority
          />
        </div>

        <div className="text-center relative z-10">
          <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight mb-2">
            Selamat Datang!
          </h2>
          <p className="text-gray-600 dark:text-slate-300 font-medium text-sm leading-relaxed">
            Masuk ke akun SkillSpace Anda dan mulai kembangkan keahlian baru.
          </p>
        </div>

        <div className="space-y-4 relative z-10 text-center">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3.5 py-4 px-6 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-[1.75rem] text-base font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 hover:border-blue-200 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 shadow-md shadow-gray-200/20 dark:shadow-none group min-h-12 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
            aria-label="Lanjutkan login dengan Google"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            Lanjutkan dengan Google
          </button>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 p-4 rounded-2xl text-xs font-semibold border border-red-100 dark:border-red-900/60 animate-in fade-in slide-in-from-top-2 duration-300" role="alert">
              {error}
            </div>
          )}

          <div className="pt-2">
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">
              Belum memiliki akun?{' '}
              <Link href="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 transition-all focus-visible:outline-2 focus-visible:outline-blue-600 rounded">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
