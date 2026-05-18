'use client'

import React, { useState, useEffect } from 'react'
import { MentorService } from '@/services/mentorService'
import { Profile, Portfolio } from '@/types/database'
import { User, ShieldCheck, Briefcase, ChevronRight, Search, Sparkles, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MentorsPage() {
  const [mentors, setMentors] = useState<(Profile & { portfolios: Portfolio[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function loadMentors() {
      try {
        const data = await MentorService.getAllMentors()
        setMentors(data)
      } catch (err) {
        console.error('Error loading mentors:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMentors()
  }, [])

  const filteredMentors = mentors.filter(mentor => 
    mentor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mentor.bio && mentor.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Menemukan Mentor Terbaik...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <button 
            onClick={() => router.back()}
            className="group flex items-center text-gray-400 hover:text-blue-600 font-bold mb-4 transition-all duration-300 text-sm uppercase tracking-widest"
          >
            <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Kembali
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
              Direktori
            </span>
            <div className="flex items-center text-blue-600 gap-1 animate-pulse">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">Temukan Pembimbing Anda</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Daftar Mentor</h1>
          <p className="text-gray-500 font-medium mt-1">Belajar langsung dari para ahli di bidangnya.</p>
        </div>

        <div className="relative group w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Cari nama atau keahlian mentor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 shadow-xl shadow-gray-200/20 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMentors.map((mentor) => (
          <Link 
            key={mentor.id} 
            href={`/mentors/${mentor.id}`}
            className="group bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/20 border border-gray-100 p-8 hover:border-blue-500 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 group-hover:bg-blue-100 transition-colors" />
            
            <div className="flex items-center gap-5 mb-6 relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 p-1 shadow-inner overflow-hidden border-2 border-white group-hover:scale-110 transition-transform duration-500">
                {mentor.avatar_url ? (
                  <img src={mentor.avatar_url} alt={mentor.full_name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors leading-tight">
                  {mentor.full_name}
                </h3>
                {mentor.is_verified && (
                  <div className="flex items-center gap-1 text-emerald-600 mt-1">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Terverifikasi</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <p className="text-gray-500 text-sm font-medium line-clamp-3 mb-6 leading-relaxed">
                {mentor.bio || 'Mentor belum menambahkan deskripsi diri.'}
              </p>

              {mentor.portfolios.length > 0 && (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Briefcase size={12} /> Portofolio Unggulan
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mentor.portfolios.slice(0, 2).map(p => (
                      <span key={p.id} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-600 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                        {p.title}
                      </span>
                    ))}
                    {mentor.portfolios.length > 2 && (
                      <span className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-400">
                        +{mentor.portfolios.length - 2} Lainnya
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-between mt-auto">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Lihat Profil Lengkap</span>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}

        {filteredMentors.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-2xl shadow-gray-200/10">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-gray-300" size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Mentor Tidak Ditemukan</h3>
            <p className="text-gray-500 max-w-xs mx-auto font-medium">Coba gunakan kata kunci pencarian yang berbeda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
