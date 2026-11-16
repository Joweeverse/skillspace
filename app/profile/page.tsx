'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AuthService } from '@/services/authService'
import { CourseService } from '@/services/courseService'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { User, Camera, Mail, Shield, Save, ArrowLeft, Sparkles, ShieldCheck, BookOpen, CheckCircle2, Palette } from 'lucide-react'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { useToast } from '@/components/ui/Toast'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function ProfilePage() {
  const { showToast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [stats, setStats] = useState({ completedLessons: 0, passedQuizzes: 0 })
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
          passedQuizzes: totalCompleted 
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
      showToast('Profil berhasil diperbarui!', 'success')
      router.refresh()
    } catch (err: any) {
      showToast(`Gagal memperbarui profil: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpgradeToMentor = async () => {
    if (!profile || !confirm('Apakah Anda yakin ingin mendaftar sebagai Mentor? Anda akan memiliki akses untuk membuat dan mengelola kursus.')) return
    
    setSaving(true)
    try {
      await AuthService.upgradeToMentor(profile.id)
      showToast('Selamat! Anda sekarang adalah seorang Mentor.', 'success')
      router.push('/dashboard/mentor')
      router.refresh()
    } catch (err: any) {
      showToast('Gagal upgrade role: ' + err.message, 'error')
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
      await AuthService.updateProfile(profile.id, { avatar_url: publicUrl })
      showToast('Foto profil berhasil diperbarui!', 'success')
    } catch (err: any) {
      showToast(`Gagal mengunggah foto: ${err.message}`, 'error')
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
        className="group flex items-center text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold mb-10 transition-all duration-300 text-sm uppercase tracking-widest"
      >
        <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg mr-3 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <ArrowLeft size={16} />
        </div>
        Kembali
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden">
        {/* Cover banner using ImageSlot */}
        <div className="h-48 relative overflow-hidden">
          <ImageSlot
            src="/illustrations/profile-cover.svg"
            alt="Profile cover"
            aspectRatio="6/2"
            rounded={false}
            priority
          />
        </div>
        
        <div className="px-10 pb-12">
          <div className="relative -mt-20 mb-12 flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2rem] bg-white dark:bg-slate-900 p-1.5 shadow-2xl overflow-hidden border-4 border-white dark:border-slate-800">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-[1.5rem] dark:brightness-95"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-4xl font-black rounded-[1.5rem] select-none">
                    {profile?.full_name
                      ? profile.full_name.split(' ').filter(Boolean).slice(0, 2).map((n: string) => n[0].toUpperCase()).join('')
                      : <User size={48} />
                    }
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300 transform hover:scale-110 border border-gray-100 dark:border-slate-700"
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
                <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{profile?.full_name}</h1>
                <div className="flex items-center justify-center gap-2">
                  <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                    {profile?.role}
                  </span>
                  {profile?.is_verified && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <ShieldCheck size={12} /> Terverifikasi
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-400 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} />
                {email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-full" />
                  <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Informasi Personal</h3>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors">
                          <User size={20} />
                        </div>
                        <input 
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                          required
                          placeholder="Nama Lengkap"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 opacity-60">
                      <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center text-gray-400 dark:text-slate-500">
                          <Mail size={20} />
                        </div>
                        <input 
                          type="email" 
                          value={email}
                          disabled
                          className="block w-full pl-14 pr-6 py-4 bg-gray-100 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/60 rounded-[1.5rem] text-sm font-medium text-gray-500 dark:text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 text-blue-600/60 dark:text-blue-400/70">
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

              {/* Appearance / Tampilan Settings */}
              <div className="pt-8 border-t border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <Palette size={20} className="text-indigo-600 dark:text-indigo-400" />
                      Tampilan Antarmuka
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-slate-400 font-medium mt-0.5">
                      Pilih preferensi tema SkillSpace (Terang, Gelap, atau Otomatis mengikuti Sistem).
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-850 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800">
                  <ThemeToggle variant="inline" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-blue-50/50 dark:bg-blue-950/30 p-8 rounded-[2rem] border border-blue-100/50 dark:border-blue-900/40">
                <h4 className="text-blue-900 dark:text-blue-200 font-black text-lg mb-4 tracking-tight flex items-center gap-2">
                  <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                  Keamanan Akun
                </h4>
                <p className="text-sm text-blue-700/70 dark:text-blue-300/70 font-medium mb-6 leading-relaxed">
                  Akun Anda terhubung dengan Google. Untuk mengubah password atau setelan keamanan, silakan kunjungi akun Google Anda.
                </p>
                <a 
                  href="https://myaccount.google.com/security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-2xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-slate-750 hover:border-blue-200 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 gap-3 shadow-sm group"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Kelola Akun Google
                </a>
              </div>

              {profile?.role === 'student' && (
                <div className="bg-gray-50 dark:bg-slate-850 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800">
                  <h4 className="text-gray-900 dark:text-slate-100 font-black text-lg mb-4 tracking-tight">Statistik Belajar</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-750 shadow-sm transition-all hover:scale-[1.02] duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                          <BookOpen size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Materi Selesai</span>
                      </div>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400">{stats.completedLessons}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-750 shadow-sm transition-all hover:scale-[1.02] duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Kuis Lulus</span>
                      </div>
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.passedQuizzes}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {profile?.role === 'student' && (
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20 animate-in slide-in-from-bottom-4 duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-3">
              <h2 className="text-3xl font-black tracking-tight">Ingin Berbagi Ilmu?</h2>
              <p className="text-blue-100 font-medium max-w-md">
                Upgrade akun Anda menjadi Mentor dan mulai buat kursus pertama Anda hari ini.
              </p>
            </div>
            <Button 
              onClick={handleUpgradeToMentor}
              isLoading={saving}
              variant="secondary" 
              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-2xl font-black shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              Daftar Sebagai Mentor
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
