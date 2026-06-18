'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/authService'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

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
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-10 bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50" />

        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-[2rem] mb-8 shadow-xl shadow-blue-500/30">
            <LogIn size={40} />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
            Selamat Datang!
          </h2>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            Masuk ke akun SkillSpace Anda dan mulai kembangkan keahlian baru.
          </p>
        </div>

        <div className="mt-8 space-y-6 relative z-10 text-center">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-5 px-8 bg-white border-2 border-gray-100 rounded-[2rem] text-lg font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-300 shadow-xl shadow-gray-200/20 group"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
            )}
            Lanjutkan dengan Google
          </button>

          {error && (
            <div className="bg-red-50 text-red-500 p-5 rounded-2xl text-sm font-semibold border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <div className="pt-4">
            <p className="text-gray-500 font-medium">
              Belum memiliki akun?{' '}
              <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-8 transition-all">
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
