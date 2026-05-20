'use client'

import React, { useEffect, useState } from 'react'
import { CourseService } from '@/services/courseService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, GraduationCap, ChevronRight, Sparkles, Search, Play, User, Eye, ArrowRight, X, Clock, CheckCircle2 } from 'lucide-react'

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([])
  const [userEnrollments, setUserEnrollments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Preview Modal State
  const [selectedPreview, setSelectedPreview] = useState<any | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const session = await AuthService.getSession()
        if (session?.user) {
          const profile = await AuthService.getUserProfile(session.user.id)
          setUserRole(profile.role)
          setStudentId(session.user.id)
          
          if (profile.role === 'student') {
            const enrollments = await CourseService.getUserEnrollments(session.user.id)
            setUserEnrollments(enrollments.map(e => e.course_id))
          }
        }

        const data = await CourseService.getAvailableCourses()
        setCourses(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleOpenPreview = async (courseId: string) => {
    setPreviewLoading(true)
    try {
      const data = await CourseService.getCoursePreviewData(courseId)
      setSelectedPreview(data)
    } catch (err) {
      console.error(err)
      alert('Gagal memuat pratinjau kursus.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!studentId) {
      router.push('/login')
      return
    }

    if (userRole === 'mentor') {
      alert('Mentor tidak dapat mendaftar kursus.')
      return
    }

    if (userEnrollments.includes(courseId)) {
      router.push(`/learn/${courseId}`)
      return
    }
    
    try {
      await CourseService.enrollCourse(studentId, courseId)
      alert('Berhasil mendaftar! Anda sekarang bisa mulai belajar.')
      setUserEnrollments([...userEnrollments, courseId])
      router.push(`/learn/${courseId}`)
    } catch (err) {
      console.error(err)
      alert('Gagal mendaftar atau Anda sudah terdaftar.')
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Menjelajahi Katalog...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-50 text-blue-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
              Eksplorasi
            </span>
            <div className="flex items-center text-blue-600 gap-1 animate-pulse">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">Materi Baru Tersedia</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">Temukan Kursus Impian Anda</h1>
          <p className="text-xl text-gray-500 font-medium mt-4">Tingkatkan keahlian Anda dengan materi terbaik dari para mentor berpengalaman.</p>
        </div>
        <div className="bg-white px-8 py-5 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-black text-blue-600">{courses.length}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Kursus</div>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Search size={24} />
          </div>
        </div>
      </div>
      
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {courses.map((course) => {
            const isEnrolled = userEnrollments.includes(course.id)
            
            return (
              <div 
                key={course.id} 
                className="group bg-white rounded-[3rem] shadow-xl shadow-gray-200/20 border border-gray-100 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 relative"
              >
                <div className="h-56 bg-blue-600 flex items-center justify-center text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-90 group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                  
                  {/* Decorative shapes */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl transition-transform duration-500 group-hover:rotate-6">
                      <BookOpen size={40} className="text-white" />
                    </div>
                  </div>

                  {isEnrolled && (
                    <div className="absolute top-6 right-6 z-20 bg-white/20 backdrop-blur-md text-white text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-white/20 shadow-lg">
                      Terdaftar
                    </div>
                  )}
                  
                  {!isEnrolled && (
                    <button 
                      onClick={() => handleOpenPreview(course.id)}
                      className="absolute bottom-6 right-6 z-20 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white p-3 rounded-2xl border border-white/20 transition-all transform hover:scale-110"
                      title="Pratinjau Kursus"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                </div>

                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{course.category || 'Umum'}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black mb-3 text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight leading-tight">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <User size={16} />
                      </div>
                      <p className="text-sm font-bold text-gray-400">
                        {course.profiles?.full_name || 'Anonymous'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                        {course.profiles?.points || 0} Poin
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-gray-50 flex gap-3">
                    {isEnrolled && userRole === 'student' ? (
                      <Link href={`/learn/${course.id}`} className="flex-1">
                        <Button 
                          variant="secondary" 
                          className="w-full py-4 text-sm font-black rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all duration-300 group/btn"
                          rightIcon={<Play size={16} className="group-hover/btn:translate-x-1 transition-transform" />}
                        >
                          Masuk Kelas
                        </Button>
                      </Link>
                    ) : userRole === 'mentor' ? (
                      <Button 
                        onClick={() => handleOpenPreview(course.id)} 
                        className="flex-1 py-4 text-sm font-black rounded-2xl shadow-xl shadow-blue-500/20 group/btn"
                        rightIcon={<BookOpen size={18} className="group-hover/btn:translate-x-1 transition-transform" />}
                      >
                        Lihat Kurikulum
                      </Button>
                    ) : (
                      <>
                        <Button 
                          onClick={() => handleOpenPreview(course.id)}
                          variant="outline"
                          className="px-6 py-4 rounded-2xl border-gray-200 text-gray-500 hover:border-blue-600 hover:text-blue-600 transition-all"
                        >
                          <Eye size={18} />
                        </Button>
                        <Button 
                          onClick={() => handleEnroll(course.id)} 
                          className="flex-1 py-4 text-sm font-black rounded-2xl shadow-xl shadow-blue-500/20 group/btn"
                          rightIcon={<ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />}
                        >
                          Daftar Kelas
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-2xl shadow-gray-200/10">
           <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <BookOpen className="text-gray-300" size={48} />
           </div>
           <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Katalog Masih Kosong</h3>
           <p className="text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
             Belum ada kursus yang tersedia saat ini. Silakan kembali lagi nanti untuk materi terbaru.
           </p>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
              {/* Header */}
              <div className="p-8 md:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                       <BookOpen size={24} />
                    </div>
                    <div>
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedPreview.category}</span>
                       <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedPreview.title}</h3>
                    </div>
                 </div>
                 <button 
                  onClick={() => setSelectedPreview(null)}
                  className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                 >
                    <X size={24} />
                 </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Info */}
                    <div className="lg:col-span-2 space-y-10">
                       <section className="space-y-4">
                          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <ArrowRight size={14} className="text-blue-600" /> Tentang Kursus
                          </h4>
                          <p className="text-gray-600 font-medium leading-relaxed">
                             Kursus ini dirancang untuk memberikan pemahaman mendalam tentang {selectedPreview.title}. 
                             Anda akan mempelajari berbagai konsep mulai dari dasar hingga tingkat lanjut yang dibawakan langsung oleh mentor ahli.
                          </p>
                       </section>

                       <section className="space-y-6">
                          <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <ArrowRight size={14} className="text-blue-600" /> Kurikulum Pembelajaran
                          </h4>
                          <div className="space-y-3">
                             {selectedPreview.lessons?.map((lesson: any, idx: number) => (
                                <div key={lesson.id} className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:border-blue-200 transition-all duration-300">
                                   <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-xs text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                      {idx + 1}
                                   </div>
                                   <div className="flex-1">
                                      <p className="font-bold text-gray-700">{lesson.title}</p>
                                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Materi {idx + 1}</p>
                                   </div>
                                   <div className="p-2 text-gray-300">
                                      <Play size={14} />
                                   </div>
                                </div>
                             ))}
                             {(!selectedPreview.lessons || selectedPreview.lessons.length === 0) && (
                                <p className="text-sm font-bold text-gray-400 italic bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-100 text-center">
                                   Mentor belum mempublikasikan daftar materi.
                                </p>
                             )}
                          </div>
                       </section>
                    </div>

                    {/* Right Column: Mentor Info */}
                    <div className="space-y-8">
                       <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 space-y-6">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Profil Mentor</h4>
                          <div className="flex flex-col items-center text-center space-y-4">
                             <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-gray-300 relative border border-gray-100">
                                <User size={40} />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                                   <Sparkles size={16} />
                                </div>
                             </div>
                             <div>
                                <p className="text-lg font-black text-gray-900 tracking-tight">{selectedPreview.profiles?.full_name}</p>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Mentor Pengajar</p>
                             </div>
                             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                                <Sparkles size={14} className="text-amber-500" />
                                <span className="text-xs font-black text-amber-700 uppercase tracking-widest">{selectedPreview.profiles?.points || 0} Poin Mentor</span>
                             </div>
                             <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                                "{selectedPreview.profiles?.bio || 'Mentor ini berdedikasi untuk membagikan ilmunya di SkillSpace.'}"
                             </p>
                          </div>
                       </div>

                       <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-2xl shadow-blue-500/30 space-y-4 relative overflow-hidden">
                          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                          <div className="relative z-10">
                             <div className="flex items-center gap-2 mb-2">
                                <Clock size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Akses Selamanya</span>
                             </div>
                             <h5 className="text-xl font-black tracking-tight leading-tight">
                               {userRole === 'mentor' ? 'Mode Pratinjau Mentor' : 'Mulai Belajar Sekarang'}
                             </h5>
                             <p className="text-blue-100 text-xs font-medium mb-6">
                               {userRole === 'mentor' 
                                 ? 'Anda sedang melihat struktur kurikulum kursus ini.' 
                                 : 'Dapatkan akses ke seluruh materi, kuis, dan sertifikat resmi.'}
                             </p>
                             {userRole !== 'mentor' && (
                               <Button 
                                onClick={() => {
                                  handleEnroll(selectedPreview.id)
                                  setSelectedPreview(null)
                                }}
                                className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 rounded-2xl font-black text-sm border-none shadow-xl"
                               >
                                  Daftar Sekarang
                               </Button>
                             )}
                             {userRole === 'mentor' && (
                               <div className="w-full py-3 px-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center text-[10px] font-black uppercase tracking-widest">
                                 Hanya Untuk Akun Siswa
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 size={16} className="text-emerald-500" />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Akses Video</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <CheckCircle2 size={16} className="text-emerald-500" />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sertifikat Resmi</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <CheckCircle2 size={16} className="text-emerald-500" />
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Forum Diskusi</span>
                    </div>
                 </div>
                 <button 
                  onClick={() => setSelectedPreview(null)}
                  className="text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                 >
                    Tutup Pratinjau
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
