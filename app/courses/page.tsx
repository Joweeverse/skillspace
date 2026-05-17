'use client'

import React, { useEffect, useState } from 'react'
import { CourseService } from '@/services/courseService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, GraduationCap, ChevronRight, Sparkles, Search, Play } from 'lucide-react'

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([])
  const [userEnrollments, setUserEnrollments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const session = await AuthService.getSession()
        if (session?.user) {
          const profile = await AuthService.getUserProfile(session.user.id)
          setUserRole(profile.role)

          if (profile.role === 'mentor') {
            alert('Mentor tidak dapat mengambil kursus. Silakan gunakan akun Siswa.')
            router.push('/dashboard/mentor')
            return
          }

          setStudentId(session.user.id)
          const enrollments = await CourseService.getUserEnrollments(session.user.id)
          setUserEnrollments(enrollments.map(e => e.course_id))
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
  
  if (userRole === 'mentor') return null

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
                </div>

                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{course.category || 'Umum'}</span>
                  </div>
                  
                  <h3 className="text-2xl font-black mb-3 text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight leading-tight">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <GraduationCap size={16} />
                    </div>
                    <p className="text-sm font-bold text-gray-400">
                      {course.profiles?.full_name || 'Anonymous'}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-gray-50">
                    {isEnrolled ? (
                      <Link href={`/learn/${course.id}`} className="block">
                        <Button 
                          variant="secondary" 
                          className="w-full py-4 text-sm font-black rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all duration-300 group/btn"
                          rightIcon={<Play size={16} className="group-hover/btn:translate-x-1 transition-transform" />}
                        >
                          Masuk Kelas
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        onClick={() => handleEnroll(course.id)} 
                        className="w-full py-4 text-sm font-black rounded-2xl shadow-xl shadow-blue-500/20 group/btn"
                        rightIcon={<ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />}
                      >
                        Daftar Kelas
                      </Button>
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
    </div>
  )
}
