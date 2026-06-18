'use client'

import React, { useEffect, useState } from 'react'
import { CourseService } from '@/services/courseService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import { CertificateService } from '@/services/certificateService'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Trophy, Clock, ChevronRight, Award, GraduationCap, Sparkles, User, ArrowRight } from 'lucide-react'

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [certificates, setCertificates] = useState<Record<string, any>>({})
  const router = useRouter()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const session = await AuthService.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }
        setUser(session.user)
        
        const [enrollmentData, profileData] = await Promise.all([
          CourseService.getUserEnrollments(session.user.id),
          AuthService.getUserProfile(session.user.id)
        ])
        
        setEnrollments(enrollmentData || [])
        setProfile(profileData)

        // Fetch certificate designs for completed courses
        const completed = enrollmentData.filter(e => e.status === 'completed')
        const certPromises = completed.map(e => CertificateService.getCertificateByCourseId(e.course_id))
        const certResults = await Promise.all(certPromises)
        
        const certMap: Record<string, any> = {}
        certResults.forEach((c, idx) => {
          if (c) certMap[completed[idx].course_id] = c
        })
        setCertificates(certMap)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [router])

  const handleUpgradeToMentor = async () => {
    if (!user || !confirm('Apakah Anda yakin ingin mendaftar sebagai Mentor? Anda akan memiliki akses untuk membuat dan mengelola kursus.')) return
    
    try {
      setLoading(true)
      await AuthService.upgradeToMentor(user.id)
      alert('Selamat! Anda sekarang adalah seorang Mentor. Silakan mulai berbagi ilmu.')
      router.push('/dashboard/mentor')
      router.refresh()
    } catch (err: any) {
      alert('Gagal upgrade role: ' + err.message)
      setLoading(false)
    }
  }

  const handleDownloadCert = async (courseId: string, courseTitle: string) => {
    const cert = certificates[courseId] || null
    await CertificateService.downloadCertificatePDF(
      cert,
      courseTitle,
      profile?.full_name || 'Siswa SkillSpace',
      courseId
    )
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Memuat Dashboard Anda...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
              Siswa
            </span>
            <div className="flex items-center text-blue-600 gap-1 animate-pulse">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">Teruslah Belajar</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Dashboard Belajar</h1>
          <p className="text-gray-500 font-medium mt-1">Selamat datang kembali, mari lanjutkan progres Anda hari ini.</p>
        </div>
        
        <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-[1.5rem] border border-gray-100 shadow-xl shadow-gray-200/20">
          <div className="text-center">
            <div className="text-2xl font-black text-blue-600">{enrollments.length}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kursus Aktif</div>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-600">
              {enrollments.filter(e => e.completed_lessons?.length >= (e.courses?.lessons?.length || 1)).length}
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selesai</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Materi Belajar Saya</h2>
        </div>

        {enrollments.map((enroll) => {
          const course = enroll.courses
          if (!course) return null

          const lessons = course.lessons || []
          const totalLessons = lessons.length
          const completedCount = enroll.completed_lessons?.length || 0
          
          const progress = totalLessons > 0 
            ? Math.min(Math.round((completedCount / totalLessons) * 100), 100) 
            : 0
            
          const isFinished = totalLessons > 0 && completedCount >= totalLessons

          return (
            <div 
              key={enroll.course_id} 
              className="group bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/20 border border-gray-100 p-2 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1"
            >
              <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 border border-blue-100/50">
                    <BookOpen size={32} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{course.category || 'Umum'}</span>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <div className="flex items-center gap-4 pt-1">
                      <p className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
                        <GraduationCap size={16} className="text-gray-300" />
                        {course.profiles?.full_name || 'Anonymous'}
                      </p>
                      <div className="w-1 h-1 bg-gray-200 rounded-full" />
                      <p className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
                        <Clock size={16} className="text-gray-300" />
                        {totalLessons} Materi
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-md w-full">
                  <div className="flex justify-between items-end mb-3">
                    <span className={`text-xs font-black uppercase tracking-widest ${isFinished ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {isFinished ? 'Selesai Sempurna' : 'Progres Belajar'}
                    </span>
                    <span className={`text-sm font-black ${isFinished ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-50">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${isFinished ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-blue-600 shadow-lg shadow-blue-500/30'}`} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${isFinished ? 'bg-emerald-500' : 'bg-blue-600'} animate-pulse`} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {completedCount} dari {totalLessons} materi telah dikuasai
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
                  <Link href={`/learn/${enroll.course_id}`} className="w-full">
                    <Button 
                      as="div"
                      variant={isFinished ? 'outline' : 'primary'} 
                      className={`w-full py-4 text-sm font-black rounded-2xl ${!isFinished && 'shadow-lg shadow-blue-500/25'}`}
                      rightIcon={!isFinished && <ChevronRight size={18} />}
                    >
                      {isFinished ? 'Review Materi' : 'Lanjut Belajar'}
                    </Button>
                  </Link>
                  {isFinished && (
                    <Button 
                      onClick={() => handleDownloadCert(enroll.course_id, course.title)} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-4 text-sm font-black rounded-2xl shadow-lg shadow-emerald-500/25"
                      leftIcon={<Award size={18} />}
                    >
                      Sertifikat
                    </Button>
                  )}

                </div>
              </div>
            </div>
          )
        })}

        {enrollments.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-2xl shadow-gray-200/10">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-gray-50/50">
               <BookOpen className="text-gray-300" size={40} />
            </div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Belum Ada Aktivitas Belajar</h3>
            <p className="text-gray-500 mb-10 max-w-xs mx-auto font-medium leading-relaxed">Anda belum mendaftar di kursus apa pun. Ayo mulai belajar hal baru hari ini!</p>
            <Link href="/courses">
              <Button as="div" size="lg" className="px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-blue-500/25">
                Jelajahi Katalog Kursus
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Wujudkan Potensi Anda</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Punya Keahlian Untuk Dibagikan?</h2>
            <p className="text-blue-100 text-lg font-medium max-w-xl">
              Daftar sebagai Mentor di SkillSpace dan mulai buat kursus Anda sendiri. Bantu orang lain tumbuh sambil membangun personal brand Anda.
            </p>
          </div>
          <Button 
            onClick={handleUpgradeToMentor}
            variant="secondary" 
            size="lg" 
            className="bg-white text-blue-700 hover:bg-blue-50 px-10 py-6 rounded-[2rem] font-black shadow-2xl transition-all hover:scale-105 active:scale-95"
            rightIcon={<ArrowRight size={22} />}
          >
            Daftar Sebagai Mentor
          </Button>
        </div>
      </div>
    </div>
  )
}
