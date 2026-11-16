'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import Link from 'next/link'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { ImageSlot } from '@/components/ui/ImageSlot'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await AuthService.resetPasswordForEmail(email)
      setMessage({
        type: 'success',
        text: 'Instruksi pemulihan kata sandi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.'
      })
    } catch (err: any) {
      console.error('Forgot password error details:', err)
      
      let errorMessage = 'Gagal mengirim email pemulihan.'
      
      if (err.status === 429) {
        errorMessage = 'Terlalu banyak permintaan (Rate Limit). Supabase membatasi pengiriman email reset. Silakan tunggu 1 jam atau gunakan email lain.'
      } else if (err.message) {
        errorMessage = err.message
      } else if (typeof err === 'object') {
        errorMessage = JSON.stringify(err) === '{}' 
          ? 'Error tidak dikenal (Object Kosong). Cek koneksi internet atau Ad-Blocker Anda.'
          : JSON.stringify(err)
      }

      setMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-950 py-16 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 dark:shadow-none border border-gray-100 dark:border-slate-800">
        <div className="text-center">
          <Link href="/login" className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4 group focus-visible:outline-2 focus-visible:outline-blue-600 rounded">
            <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
            Kembali ke Login
          </Link>
          <div className="w-44 mx-auto mb-3">
            <ImageSlot
              src="/illustrations/auth-password.svg"
              alt="Ilustrasi pemulihan kata sandi"
              aspectRatio="16/9"
              priority
            />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight mb-2">
            Lupa Kata Sandi?
          </h2>
          <p className="text-gray-600 dark:text-slate-300 font-medium text-sm leading-relaxed">
            Masukkan email Anda dan kami akan mengirimkan link untuk mengatur ulang kata sandi.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className={`p-5 rounded-2xl text-sm font-semibold border animate-in fade-in duration-300 ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-emerald-950/40 text-green-600 dark:text-emerald-300 border-green-100 dark:border-emerald-900/60' 
                : 'bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-300 border-red-100 dark:border-red-900/60'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Alamat Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                <Mail size={20} />
              </div>
              <input
                id="email"
                type="email"
                required
                className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            isLoading={loading}
            className="w-full py-5 text-lg font-bold rounded-[1.5rem] shadow-xl shadow-blue-500/25"
            rightIcon={<Send size={20} />}
          >
            Kirim Link Pemulihan
          </Button>
        </form>
      </div>
    </div>
  )
}
