'use client'

import React, { useEffect, useState } from 'react'
import { AdminService } from '@/services/adminService'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { useToast } from '@/components/ui/Toast'
import { UserCheck, Sparkles } from 'lucide-react'

export default function AdminDashboard() {
  const [mentors, setMentors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { showToast } = useToast()

  const loadMentors = async () => {
    try {
      setLoading(true)
      const data = await AdminService.getUnverifiedMentors()
      setMentors(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadMentors()
  }, [])

  const handleVerify = async (id: string, name: string) => {
    try {
      setVerifyingId(id)
      await AdminService.verifyMentor(id)
      showToast(`Mentor ${name} berhasil diverifikasi!`, 'success')
      loadMentors() // Refresh daftar
    } catch (err) {
      console.error(err)
      showToast('Gagal memverifikasi mentor.', 'error')
    } finally {
      setVerifyingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">
          Memuat Panel Admin...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 md:py-12 animate-in fade-in duration-500">
      {/* ── Banner header ── */}
      <div className="mb-10 rounded-[2rem] overflow-hidden relative shadow-xl shadow-blue-500/10 dark:shadow-none border border-blue-100 dark:border-slate-800">
        <ImageSlot
          src="/illustrations/admin-banner.svg"
          alt="Admin Control Panel SkillSpace"
          aspectRatio="3/1"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 bg-gradient-to-r from-white/70 via-white/40 to-transparent dark:from-slate-950/85 dark:via-slate-900/70 dark:to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              Admin
            </span>
            <div className="flex items-center text-indigo-600 dark:text-indigo-400 gap-1 animate-pulse">
              <Sparkles size={13} />
              <span className="text-[10px] font-black uppercase tracking-wider">Verifikasi Pengajar</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Admin Control Panel</h1>
          <p className="text-gray-600 dark:text-slate-300 font-medium text-xs md:text-sm mt-0.5">
            Verifikasi dan berikan akses pengajar untuk mentor baru SkillSpace.
          </p>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Pengajuan Mentor Baru</h2>
            <p className="text-gray-500 dark:text-slate-400 text-xs font-medium mt-0.5">Tinjau profil dan verifikasi akun mentor.</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto">
            {mentors.length} Pengajuan Pending
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/70 dark:bg-slate-800/70 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Nama Mentor</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">ID User</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {mentors.length > 0 ? (
                mentors.map((mentor) => (
                  <tr key={mentor.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-slate-100 text-sm">{mentor.full_name}</div>
                      <div className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                        Mendaftar pada: {mounted ? new Date(mentor.updated_at || '').toLocaleDateString('id-ID') : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-400 font-mono">
                      {mentor.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        isLoading={verifyingId === mentor.id}
                        onClick={() => handleVerify(mentor.id, mentor.full_name)}
                        className="rounded-xl font-bold shadow-md shadow-blue-500/15"
                        leftIcon={<UserCheck size={16} />}
                      >
                        Berikan Akses
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <div className="w-48 mx-auto mb-4">
                      <ImageSlot
                        src="/illustrations/empty-courses.svg"
                        alt="Tidak ada pengajuan mentor"
                        aspectRatio="4/3"
                      />
                    </div>
                    <p className="text-gray-900 dark:text-slate-100 font-bold text-base mb-1">Semua Pengajuan Selesai Diproses</p>
                    <p className="text-gray-500 dark:text-slate-400 text-xs font-medium">Tidak ada pengajuan mentor yang menunggu verifikasi saat ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
