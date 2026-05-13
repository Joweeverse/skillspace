'use client'

import React, { useEffect, useState } from 'react'
import { AdminService } from '@/services/adminService'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'

export default function AdminDashboard() {
  const [mentors, setMentors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

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
    loadMentors()
  }, [])

  const handleVerify = async (id: string) => {
    try {
      await AdminService.verifyMentor(id)
      alert('Mentor berhasil diverifikasi!')
      loadMentors() // Refresh daftar
    } catch (err) {
      console.error(err)
      alert('Gagal memverifikasi mentor.')
    }
  }

  if (loading) return <div className="p-8 text-center">Memuat data mentor...</div>

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500">Verifikasi pengajuan mentor baru SkillSpace</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
          {mentors.length} Pengajuan Pending
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nama Mentor</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">ID User</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mentors.length > 0 ? (
              mentors.map((mentor) => (
                <tr key={mentor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{mentor.full_name}</div>
                    <div className="text-xs text-gray-500">Mendaftar pada: {new Date(mentor.updated_at || '').toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {mentor.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button onClick={() => handleVerify(mentor.id)}>
                      Berikan Akses
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  Tidak ada pengajuan mentor saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
