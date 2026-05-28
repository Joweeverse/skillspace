'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { UserRole } from '@/types/database'
import Link from 'next/link'
import { Mail, Lock, User, UserPlus, ArrowRight, GraduationCap, Presentation, ShieldCheck, RefreshCw } from 'lucide-react'

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
      
      // Jika auto-confirm aktif di Supabase, session akan langsung ada
      if (data.session) {
        alert('Pendaftaran berhasil! Akun Anda sudah aktif.')
        router.push('/login')
        return
      }

      setStep(2)
      setSuccess('Kode verifikasi telah dikirim ke email Anda.')
    } catch (err: any) {
      console.error('Registration error details:', {
        name: err.name,
        message: err.message,
        status: err.status,
        err: err
      })
      
      let errorMessage = 'Gagal mendaftar. Silakan coba lagi.'
      
      if (err.name === 'AuthRetryableFetchError' || err.message?.includes('fetch')) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        errorMessage = `Kesalahan Koneksi: Tidak dapat menjangkau server Supabase (${supabaseUrl || 'URL KOSONG'}). Pastikan internet Anda stabil, matikan Ad-Blocker/VPN, dan pastikan Anda sudah ME-RESTART server (npm run dev) setelah mengisi .env.local.`
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.error_description) {
        errorMessage = err.error_description
      } else if (typeof err === 'string') {
        errorMessage = err
      } else {
        // Fallback for objects that stringify to {}
        errorMessage = `Error (${err.name || 'Unknown'}): Mohon periksa konsol browser (F12) untuk detail teknis.`
      }

      // Jika user sudah terdaftar tapi belum konfirmasi, izinkan lanjut ke Step 2
      if (errorMessage.toLowerCase().includes('already registered')) {
        setStep(2)
        setSuccess('Email ini sudah terdaftar. Silakan masukkan kode verifikasi yang telah dikirim ke email Anda, atau klik "Kirim Ulang Kode".')
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
    <div className="min-h-[95vh] flex items-center justify-center bg-gray-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-10 bg-white p-10 md:p-14 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100">
        {step === 1 ? (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-[2rem] mb-8 shadow-xl shadow-blue-500/30 transform hover:rotate-6 transition-transform duration-300">
                <UserPlus size={40} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
                Bergabung Sekarang
              </h2>
              <p className="text-gray-500 font-medium text-lg">
                Mulai perjalanan belajar atau mengajar Anda di SkillSpace.
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 text-red-500 p-5 rounded-2xl text-sm font-semibold border border-red-100 animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Pilih Peran Anda</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all duration-300 gap-3 group ${
                        role === 'student'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-md shadow-blue-500/10'
                        : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-white'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl transition-colors ${role === 'student' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 group-hover:text-gray-600'}`}>
                        <GraduationCap size={24} />
                      </div>
                      <span className="font-bold text-sm">Siswa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('mentor')}
                      className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all duration-300 gap-3 group ${
                        role === 'mentor'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-md shadow-blue-500/10'
                        : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-white'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl transition-colors ${role === 'mentor' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 group-hover:text-gray-600'}`}>
                        <Presentation size={24} />
                      </div>
                      <span className="font-bold text-sm">Mentor</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="full-name" className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <User size={20} />
                      </div>
                      <input
                        id="full-name"
                        name="fullName"
                        type="text"
                        required
                        className="block w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-400"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email-address" className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Mail size={20} />
                      </div>
                      <input
                        id="email-address"
                        name="email"
                        type="email"
                        required
                        className="block w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-400"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={20} />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="block w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-400"
                        placeholder="Minimal 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  isLoading={loading}
                  className="w-full py-5 text-lg font-bold rounded-[1.5rem] shadow-xl shadow-blue-500/25"
                  rightIcon={<ArrowRight size={22} />}
                >
                  Buat Akun Sekarang
                </Button>
              </div>

              <div className="text-center pt-2">
                <p className="text-gray-500 font-medium">
                  Sudah memiliki akun?{' '}
                  <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-8 transition-all">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-green-500 to-emerald-600 text-white rounded-[2rem] mb-8 shadow-xl shadow-green-500/30 transform hover:rotate-6 transition-transform duration-300">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
                Verifikasi Email
              </h2>
              <p className="text-gray-500 font-medium text-lg">
                Masukkan 6 digit kode yang kami kirimkan ke <span className="text-gray-900 font-bold">{email}</span>.
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleVerify}>
              {error && (
                <div className="bg-red-50 text-red-500 p-5 rounded-2xl text-sm font-semibold border border-red-100 animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 p-5 rounded-2xl text-sm font-semibold border border-green-100 animate-in fade-in zoom-in duration-300">
                  {success}
                </div>
              )}
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="otp-code" className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kode Verifikasi</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                    <input
                      id="otp-code"
                      name="otpCode"
                      type="text"
                      required
                      maxLength={6}
                      className="block w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-center text-2xl font-black tracking-[0.5em] transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-300"
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
                  className="w-full py-4 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  <RefreshCw size={18} className={`transition-transform duration-500 ${resending ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                  {resending ? 'Mengirim Ulang...' : 'Kirim Ulang Kode'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
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
