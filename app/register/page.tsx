'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { UserRole } from '@/types/database'
import Link from 'next/link'
import { Mail, Lock, User, UserPlus, ArrowRight, GraduationCap, Presentation, ShieldCheck, RefreshCw } from 'lucide-react'
import { ImageSlot } from '@/components/ui/ImageSlot'

export default function RegisterPage() {
  const [step, setStep] = useState(1) // 1: Register details, 2: Verification code
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'account_not_found') {
      setError('Akun Google Anda belum terdaftar. Silakan pilih peran dan daftar terlebih dahulu.')
    }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.')
      setLoading(false)
      return
    }

    try {
      const data = await AuthService.signUp(email, password, fullName, role)
      
      // Jika email auto-confirm AKTIF di Supabase, session akan langsung ada
      if (data.user) {
        // Check if verification is needed
        if (data.session) {
          alert('Pendaftaran berhasil! Akun Anda sudah aktif.')
          router.push('/login')
        } else {
          setStep(2)
          setSuccess('Kode verifikasi telah dikirim ke email Anda.')
        }
        return
      }

      setStep(2)
      setSuccess('Kode verifikasi telah dikirim ke email Anda.')
    } catch (err: any) {
      console.error('Registration error details:', err)
      
      let errorMessage = 'Gagal mendaftar. Silakan coba lagi.'
      
      if (err.status === 429) {
        errorMessage = 'Terlalu banyak permintaan (Rate Limit). Supabase membatasi pengiriman email (maksimal 3 per jam untuk provider gratis). Silakan tunggu beberapa saat atau gunakan email lain.'
      } else if (err.name === 'AuthRetryableFetchError' || err.message?.includes('fetch')) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        errorMessage = `Kesalahan Koneksi: Tidak dapat menjangkau server Supabase (${supabaseUrl || 'URL KOSONG'}). Pastikan internet Anda stabil, matikan Ad-Blocker, dan pastikan server sudah di-restart (npm run dev).`
      } else if (err.message === 'Database error saving new user') {
        errorMessage = 'Terjadi kesalahan pada Database (Trigger). Pastikan Anda sudah menjalankan SQL setup (database_setup.sql) di Dashboard Supabase.'
      } else if (err.message) {
        errorMessage = err.message
      }

      // Jika user sudah terdaftar tapi belum konfirmasi, izinkan lanjut ke Step 2
      if (errorMessage.toLowerCase().includes('already registered')) {
        setStep(2)
        setSuccess('Email ini sudah terdaftar namun belum dikonfirmasi. Silakan masukkan kode verifikasi yang telah dikirim ke email Anda.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (otpCode.length !== 6) {
      setError('Kode verifikasi harus 6 digit.')
      setLoading(false)
      return
    }

    try {
      await AuthService.verifySignUp(email.trim(), otpCode)
      alert('Akun Anda berhasil diverifikasi! Silakan masuk.')
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Kode verifikasi salah atau sudah kadaluarsa.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResending(true)
    setError(null)
    setSuccess(null)

    try {
      await AuthService.resendVerificationCode(email.trim())
      setSuccess('Kode verifikasi baru telah dikirim.')
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang kode.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-[95vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-10 bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 dark:shadow-none border border-gray-100 dark:border-slate-800">
        {step === 1 ? (
          <>
            <div className="text-center">
              <div className="w-48 mx-auto mb-4">
                <ImageSlot
                  src="/illustrations/auth-register.svg"
                  alt="Bergabung dengan komunitas SkillSpace"
                  aspectRatio="16/9"
                  priority
                />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight mb-2">
                Bergabung Sekarang
              </h2>
              <p className="text-gray-600 dark:text-slate-300 font-medium text-sm">
                Mulai perjalanan belajar atau mengajar Anda di SkillSpace.
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-300 p-5 rounded-2xl text-sm font-semibold border border-red-100 dark:border-red-900/60 animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Pilih Peran Anda</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all duration-300 gap-3 group ${
                        role === 'student'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/10'
                        : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 text-gray-400 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl transition-colors ${role === 'student' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-400 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-200'}`}>
                        <GraduationCap size={24} />
                      </div>
                      <span className="font-bold text-sm">Siswa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('mentor')}
                      className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all duration-300 gap-3 group ${
                        role === 'mentor'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/10'
                        : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 text-gray-400 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl transition-colors ${role === 'mentor' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-400 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-200'}`}>
                        <Presentation size={24} />
                      </div>
                      <span className="font-bold text-sm">Mentor</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <User size={20} />
                      </div>
                      <input
                        type="text"
                        required
                        className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-gray-900 dark:text-slate-100 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-300 dark:placeholder:text-slate-500 font-bold"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Mail size={20} />
                      </div>
                      <input
                        type="email"
                        required
                        className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-gray-900 dark:text-slate-100 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-300 dark:placeholder:text-slate-500 font-bold"
                        placeholder="email@contoh.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={20} />
                      </div>
                      <input
                        type="password"
                        required
                        minLength={6}
                        className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-gray-900 dark:text-slate-100 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-300 dark:placeholder:text-slate-500 font-bold"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  isLoading={loading}
                  className="w-full py-5 text-lg font-bold rounded-[1.5rem] shadow-xl shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none flex items-center justify-center gap-2 group"
                >
                  Daftar Sekarang
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100 dark:border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm uppercase">
                    <span className="bg-white dark:bg-slate-900 px-4 text-gray-400 dark:text-slate-500 font-black tracking-widest">Atau</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true)
                      AuthService.signInWithGoogle(role, 'register')
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 py-5 px-8 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-[2rem] text-lg font-bold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750 hover:border-blue-200 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 shadow-xl shadow-gray-200/20 dark:shadow-none group"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    )}
                    Daftar dengan Google sebagai {role === 'student' ? 'Siswa' : 'Mentor'}
                  </button>

                  <div className="text-center pt-4">
                    <p className="text-gray-500 dark:text-slate-400 font-medium">
                      Sudah memiliki akun?{' '}
                      <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-8 transition-all">
                        Masuk di sini
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-green-500 to-emerald-600 text-white rounded-[2rem] mb-8 shadow-xl shadow-green-500/30 transform hover:rotate-6 transition-transform duration-300">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tight mb-3">
                Verifikasi Email
              </h2>
              <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">
                Masukkan 6 digit kode yang kami kirimkan ke <span className="text-gray-900 dark:text-slate-100 font-bold">{email}</span>.
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleVerify}>
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-300 p-5 rounded-2xl text-sm font-semibold border border-red-100 dark:border-red-900/60 animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-emerald-950/40 text-green-600 dark:text-emerald-300 p-5 rounded-2xl text-sm font-semibold border border-green-100 dark:border-emerald-900/60 animate-in fade-in zoom-in duration-300">
                  {success}
                </div>
              )}
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="otp-code" className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Kode Verifikasi</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                    <input
                      id="otp-code"
                      name="otpCode"
                      type="text"
                      required
                      maxLength={6}
                      className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-center text-2xl font-black tracking-[0.5em] text-gray-900 dark:text-slate-100 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-300 dark:placeholder:text-slate-500"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  isLoading={loading}
                  className="w-full py-5 text-lg font-bold rounded-[1.5rem] shadow-xl shadow-green-500/25 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-none"
                >
                  Verifikasi Akun
                </Button>
                
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="w-full py-4 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  <RefreshCw size={18} className={`transition-transform duration-500 ${resending ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                  {resending ? 'Mengirim Ulang...' : 'Kirim Ulang Kode'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm font-bold text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  Kembali ke Pendaftaran
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
