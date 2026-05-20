'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MentorService } from '@/services/mentorService'
import { CourseService } from '@/services/courseService'
import { Profile, Portfolio, Course } from '@/types/database'
import { User, Mail, ShieldCheck, ArrowLeft, BookOpen, ExternalLink, Briefcase, Award, Star, Sparkles } from 'lucide-react'

export default function MentorPublicProfile() {
  const { id } = useParams()
  const mentorId = id as string
  const [profile, setProfile] = useState<Profile | null>(null)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, portfolioData, courseData] = await Promise.all([
          MentorService.getMentorProfile(mentorId),
          MentorService.getMentorPortfolios(mentorId),
          CourseService.getCoursesByMentorId(mentorId)
        ])
        setProfile(profileData)
        setPortfolios(portfolioData)
        setCourses(courseData)
      } catch (err) {
        console.error('Error loading mentor profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [mentorId])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Memuat Profil Mentor...</p>
    </div>
  )

  if (!profile) return (
    <div className="max-w-4xl mx-auto p-12 text-center">
      <h2 className="text-2xl font-black text-gray-900">Mentor tidak ditemukan</h2>
      <button onClick={() => router.back()} className="mt-4 text-blue-600 font-bold uppercase tracking-widest text-sm">Kembali</button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 animate-in fade-in duration-500">
      <button 
        onClick={() => router.back()}
        className="group flex items-center text-gray-400 hover:text-blue-600 font-bold mb-10 transition-all duration-300 text-sm uppercase tracking-widest"
      >
        <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
          <ArrowLeft size={16} />
        </div>
        Kembali
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-gray-100 overflow-hidden p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-40 h-40 rounded-[2rem] bg-blue-50 p-1.5 shadow-xl overflow-hidden border-4 border-white mb-6">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name} 
                    className="w-full h-full object-cover rounded-[1.5rem]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600">
                    <User size={64} />
                  </div>
                )}
              </div>
              
              <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{profile.full_name}</h1>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                  Mentor
                </span>
                {profile.is_verified && (
                  <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={12} /> Terverifikasi
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-600 font-medium leading-relaxed mb-6">
                  {profile.bio}
                </p>
              )}

              <div className="w-full pt-6 border-t border-gray-50 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-xl font-black text-blue-600">{courses.length}</div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Kursus</div>
                </div>
                <div className="text-center border-x border-gray-50">
                  <div className="text-xl font-black text-indigo-600">{portfolios.length}</div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Portofolio</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-amber-500 flex items-center justify-center gap-1">
                    <Sparkles size={16} />
                    {profile.points || 0}
                  </div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Poin</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-500/20">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <Star size={20} />
              Keahlian Mentor
            </h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-6">
              Mentor ini memiliki spesialisasi dalam bidang pengajaran dan pengembangan profesional.
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(courses.map(c => c.category))).map(cat => (
                <span key={cat} className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Portfolios and Courses */}
        <div className="lg:col-span-2 space-y-12">
          {/* Portfolios Section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Portofolio & Pengalaman</h3>
            </div>

            {portfolios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portfolios.map((item) => (
                  <div key={item.id} className="group bg-white rounded-[2rem] border border-gray-100 p-6 shadow-xl shadow-gray-200/20 hover:border-blue-500 transition-all duration-300">
                    {item.image_url && (
                      <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gray-50 border border-gray-100">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                      {item.description && <p className="text-sm text-gray-500 font-medium line-clamp-2">{item.description}</p>}
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest mt-4 hover:gap-3 transition-all"
                        >
                          Lihat Project <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                <Briefcase className="mx-auto text-gray-300 mb-4" size={40} />
                <p className="text-gray-400 font-bold">Belum ada item portofolio yang ditampilkan.</p>
              </div>
            )}
          </section>

          {/* Courses Section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Kursus yang Diajar</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  onClick={() => router.push(`/learn/${course.id}`)}
                  className="group bg-white rounded-[2rem] border border-gray-100 p-6 shadow-xl shadow-gray-200/20 hover:border-indigo-500 cursor-pointer transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <BookOpen size={24} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{course.category}</span>
                  <h4 className="text-lg font-black text-gray-900 mt-1 mb-4">{course.title}</h4>
                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lihat Detail</span>
                    <ArrowLeft className="rotate-180 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={16} />
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="col-span-full p-12 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                  <BookOpen className="mx-auto text-gray-300 mb-4" size={40} />
                  <p className="text-gray-400 font-bold">Mentor belum memiliki kursus aktif.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
