'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { AuthService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'auth_failed') {
      setTimeout(() => {
        setError('Autentikasi gagal. Silakan coba lagi.')
      }, 0)
    }
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = await AuthService.signIn(email, password)
      if (data?.user) {
        try {
          const profile = await AuthService.getUserProfile(data.user.id)
          const role = profile?.role || data.user.user_metadata?.role
          const target =
            role === 'mentor'
              ? '/dashboard/mentor'
              : role === 'admin'
              ? '/admin/dashboard'
              : '/dashboard/student'
          router.push(target)
          router.refresh()
        } catch {
          router.push('/dashboard/student')
          router.refresh()
        }
      }
    } catch (err: unknown) {
      console.error('Login error:', err)
      const authErr = err as { message?: string; status?: number }
      let errorMessage = 'Gagal masuk. Periksa kembali email dan password Anda.'
      if (authErr.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email atau password yang Anda masukkan salah.'
      } else if (authErr.message?.includes('Email not confirmed')) {
        errorMessage =
          'Email Anda belum diverifikasi. Silakan periksa kotak masuk email Anda untuk kode verifikasi.'
      } else if (authErr.status === 429) {
        errorMessage =
          'Terlalu banyak percobaan masuk yang gagal. Silakan tunggu beberapa saat.'
      } else if (authErr.message) {
        errorMessage = authErr.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true)
      setError(null)
      await AuthService.signInWithGoogle('student', 'login')
    } catch (err: unknown) {
      const authErr = err as { message?: string }
      setError(authErr.message || 'Gagal login dengan Google')
      setGoogleLoading(false)
    }
  }

  const isSubmitting = loading || googleLoading

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 dark:shadow-none border border-gray-100 dark:border-slate-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 dark:bg-blue-950/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-50 dark:bg-indigo-950/30 rounded-full blur-3xl opacity-50 pointer-events-none" />

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

        {error && (
          <div
            className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 p-4 rounded-2xl text-xs sm:text-sm font-semibold border border-red-100 dark:border-red-900/60 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Form Login Email & Password */}
        <form onSubmit={handleEmailLogin} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1"
            >
              Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                <Mail size={20} />
              </div>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-gray-900 dark:text-slate-100 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500 font-bold text-sm min-h-[48px]"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label
                htmlFor="password"
                className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-[0.2em]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1 px-1 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                <Lock size={20} />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="block w-full pl-14 pr-12 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-gray-900 dark:text-slate-100 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500 font-bold text-sm min-h-[48px]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded-r-[1.5rem] min-w-[44px] justify-center"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            disabled={isSubmitting}
            className="w-full py-4 text-base font-bold rounded-[1.5rem] shadow-xl shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none flex items-center justify-center gap-2 group min-h-[48px]"
          >
            Masuk
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </form>

        <div className="relative py-1 z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-4 text-gray-400 dark:text-slate-500 font-black tracking-widest">
              Atau
            </span>
          </div>
        </div>

        <div className="space-y-4 relative z-10 text-center">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3.5 py-4 px-6 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-[1.75rem] text-base font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 hover:border-blue-200 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 shadow-md shadow-gray-200/20 dark:shadow-none group min-h-[48px] focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
            aria-label="Lanjutkan login dengan Google"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5 group-hover:scale-110 transition-transform"
              />
            )}
            Lanjutkan dengan Google
          </button>

          <div className="pt-2">
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">
              Belum memiliki akun?{' '}
              <Link
                href="/register"
                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 transition-all focus-visible:outline-2 focus-visible:outline-blue-600 rounded inline-block py-1"
              >
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
