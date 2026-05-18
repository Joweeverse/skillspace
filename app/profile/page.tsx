'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AuthService } from '@/services/authService'
import { CourseService } from '@/services/courseService'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { User, Camera, Mail, Shield, Save, ArrowLeft, Loader2, Sparkles, ShieldCheck, BookOpen, CheckCircle2, X, Lock } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [stats, setStats] = useState({ completedLessons: 0, passedQuizzes: 0 })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      try {
        const session = await AuthService.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }
        setEmail(session.user.email || '')
        
        const [profileData, enrollments] = await Promise.all([
          AuthService.getUserProfile(session.user.id),
          CourseService.getUserEnrollments(session.user.id)
        ])

        setProfile(profileData)
        setFullName(profileData.full_name)
        setAvatarUrl(profileData.avatar_url || null)

        // Calculate Stats
        const totalCompleted = enrollments.reduce((sum, enroll) => 
          sum + (enroll.completed_lessons?.length || 0), 0
        )
        setStats({ 
          completedLessons: totalCompleted, 
          passedQuizzes: totalCompleted // Since passing quiz marks lesson as completed
        })

      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    
    setSaving(true)
    try {
      await AuthService.updateProfile(profile.id, {
        full_name: fullName,
        avatar_url: avatarUrl || undefined
      })
      alert('Profil berhasil diperbarui!')
      router.refresh()
    } catch (err: any) {
      alert(`Gagal memperbarui profil: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setSaving(true)
    try {
      const publicUrl = await AuthService.uploadAvatar(profile.id, file)
      setAvatarUrl(publicUrl)
      // Automatically update profile with new avatar URL
      await AuthService.updateProfile(profile.id, { avatar_url: publicUrl })
      alert('Foto profil berhasil diperbarui!')
    } catch (err: any) {
      alert(`Gagal mengunggah foto: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('Password baru tidak cocok!')
      return
    }
    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter!')
      return
    }

    setSaving(true)
    try {
      await AuthService.updatePassword(newPassword)
      alert('Password berhasil diperbarui!')
      setShowPasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      alert(`Gagal memperbarui password: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Menyiapkan Profil...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-8 md:p-12 animate-in fade-in duration-500">
      <button 
        onClick={() => router.back()}
        className="group flex items-center text-gray-400 hover:text-blue-600 font-bold mb-10 transition-all duration-300 text-sm uppercase tracking-widest"
      >
        <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          <ArrowLeft size={16} />
        </div>
        Kembali ke Beranda
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100 overflow-hidden">
        {/* Header/Cover Placeholder */}
        <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        </div>
        
        <div className="px-10 pb-12">
          <div className="relative -mt-20 mb-12 flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2rem] bg-white p-1.5 shadow-2xl overflow-hidden border-4 border-white">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-[1.5rem]"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 rounded-[1.5rem]">
                    <User size={64} />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-3 bg-white text-blue-600 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110 border border-gray-100"
                title="Ganti Foto Profil"
              >
                <Camera size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left pb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{profile?.full_name}</h1>
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                    {profile?.role}
                  </span>
                  {profile?.is_verified && (
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <ShieldCheck size={12} /> Terverifikasi
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} />
                {email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Informasi Personal</h3>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <User size={20} />
                      </div>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-400"
                        required
                        placeholder="Nama Lengkap"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 opacity-60">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center text-gray-400">
                        <Mail size={20} />
                      </div>
                      <input 
                        type="email" 
                        value={email}
                        disabled
                        className="block w-full pl-14 pr-6 py-4 bg-gray-100 border border-gray-100 rounded-[1.5rem] text-sm font-medium cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase ml-1 tracking-tighter">* Email tidak dapat diubah</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3 text-blue-600/60">
                    <Sparkles size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Update profil Anda secara berkala</span>
                  </div>
                  <Button 
                    type="submit" 
                    isLoading={saving}
                    className="w-full md:w-auto px-10 py-4 font-black rounded-2xl shadow-xl shadow-blue-500/20"
                    rightIcon={<Save size={20} />}
                  >
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>

            <div className="space-y-8">
              <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100/50">
                <h4 className="text-blue-900 font-black text-lg mb-4 tracking-tight flex items-center gap-2">
                  <Shield size={20} className="text-blue-600" />
                  Keamanan Akun
                </h4>
                <p className="text-sm text-blue-700/70 font-medium mb-6 leading-relaxed">
                  Pastikan akun Anda tetap aman dengan menggunakan password yang kuat dan unik.
                </p>
                <Button 
                  onClick={() => setShowPasswordModal(true)}
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  Ubah Password
                </Button>
              </div>

              {profile?.role === 'student' && (
                <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                  <h4 className="text-gray-900 font-black text-lg mb-4 tracking-tight">Statistik Belajar</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-[1.02] duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <BookOpen size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-500">Materi Selesai</span>
                      </div>
                      <span className="text-xl font-black text-blue-600">{stats.completedLessons}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:scale-[1.02] duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-500">Kuis Lulus</span>
                      </div>
                      <span className="text-xl font-black text-indigo-600">{stats.passedQuizzes}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Lock size={20} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Ubah Password</h3>
              </div>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handlePasswordUpdate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Password Baru</label>
                <input 
                  type="password" 
                  className="block w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Konfirmasi Password</label>
                <input 
                  type="password" 
                  className="block w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button type="submit" isLoading={saving} className="w-full py-5 rounded-[1.5rem] font-black shadow-xl shadow-blue-500/20">
                Perbarui Password
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
