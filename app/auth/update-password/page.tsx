'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { ImageSlot } from '@/components/ui/ImageSlot'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('Kata sandi minimal harus 6 karakter.')
      setLoading(false)
      return
    }

    try {
      await AuthService.updatePassword(password)
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui kata sandi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 py-16 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100">
        <div className="text-center">
          <div className="w-44 mx-auto mb-3">
            <ImageSlot
              src="/illustrations/auth-password.svg"
              alt="Atur ulang kata sandi"
              aspectRatio="16/9"
              priority
            />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Atur Ulang Kata Sandi
          </h2>
          <p className="text-gray-600 font-medium text-sm">
            Masukkan kata sandi baru Anda di bawah ini.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-100 p-6 rounded-[1.5rem] text-center space-y-4">
            <div className="flex justify-center text-green-500">
              <CheckCircle size={48} />
            </div>
            <p className="text-green-700 font-bold">Kata sandi berhasil diperbarui!</p>
            <p className="text-green-600 text-sm">Anda akan dialihkan ke halaman login dalam beberapa detik...</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleUpdate}>
            {error && (
              <div className="bg-red-50 text-red-500 p-5 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-3">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kata Sandi Baru</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="block w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              isLoading={loading}
              className="w-full py-5 text-lg font-bold rounded-[1.5rem] shadow-xl shadow-blue-500/25"
            >
              Simpan Kata Sandi Baru
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
