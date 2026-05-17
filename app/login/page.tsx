'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/services/authService'
import Link from 'next/link'
import { Mail, Lock, LogIn, ArrowRight, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { user } = await AuthService.signIn(email.trim(), password)
      
      if (user) {
        const role = user.user_metadata?.role || 'student'
        
        if (role === 'mentor') {
          router.push('/dashboard/mentor')
        } else if (role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard/student')
        }
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Email atau password tidak valid')
    } finally {
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
        
        <form className="mt-8 space-y-8 relative z-10" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-500 p-5 rounded-2xl text-sm font-semibold border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email-address" className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Alamat Email</label>
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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="password" className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Password</label>
                <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Lupa Password?</a>
              </div>
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center group cursor-pointer">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-200 rounded-lg transition-all cursor-pointer"
              />
              <span className="ml-3 text-sm text-gray-500 font-bold group-hover:text-gray-700 transition-colors">
                Ingat saya
              </span>
            </label>
            <div className="flex items-center text-blue-600 gap-1 animate-pulse">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">Fast Login</span>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              isLoading={loading}
              className="w-full py-5 text-lg font-bold rounded-[1.5rem] shadow-xl shadow-blue-500/25 transition-transform active:scale-95"
              rightIcon={<ArrowRight size={22} />}
            >
              Masuk Sekarang
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-gray-500 font-medium">
              Belum memiliki akun?{' '}
              <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-8 transition-all">
                Daftar Gratis
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
