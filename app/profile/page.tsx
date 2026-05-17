'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AuthService } from '@/services/authService'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { User, Camera, Mail, Shield, Save, ArrowLeft, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
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
        const profileData = await AuthService.getUserProfile(session.user.id)
        setProfile(profileData)
        setFullName(profileData.full_name)
        setAvatarUrl(profileData.avatar_url || null)
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
    } catch (err: any) {
      alert(`Gagal mengunggah foto: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center text-gray-500 hover:text-gray-700 font-medium mb-8 transition-colors"
      >
        <ArrowLeft size={18} className="mr-2" /> Kembali
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header/Cover Placeholder */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-700"></div>
        
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-8 flex justify-center md:justify-start">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg overflow-hidden border border-gray-100">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <User size={48} />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-110"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <div className="md:ml-8 mt-18 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {profile?.role}
                </span>
                {profile?.is_verified && (
                  <span className="text-blue-500 flex items-center gap-1 text-xs font-medium">
                    <Shield size={12} /> Terverifikasi
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <User size={16} />
                  </span>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Email (Tidak dapat diubah)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <Button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2 px-8"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
