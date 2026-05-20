"use client"

import React, { useEffect, useState, use } from 'react'
import { CourseService } from '@/services/courseService'
import { Lesson, Certificate } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { DiscussionSection } from '@/components/features/DiscussionSection'
import { QuizModal } from '@/components/features/QuizModal'
import { AuthService } from '@/services/authService'
import { QuizService } from '@/services/quizService'
import { CertificateService } from '@/services/certificateService'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, CheckCircle2, PlayCircle, Lock, ArrowLeft, MoreVertical, BookOpen, User, Download, FileText, Award, Sparkles, Share2 } from 'lucide-react'

export default function LearnPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [studentName, setStudentName] = useState('')
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('enrolled')
  const [discussionTab, setDiscussionTab] = useState<'public' | 'private'>('public')
  const [currentLessonHasQuiz, setCurrentLessonHasQuiz] = useState(false)
  const [checkingQuiz, setCheckingQuiz] = useState(false)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const certificateRef = React.useRef<HTMLDivElement>(null)
  const discussionRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Fetch User and Progress
  useEffect(() => {
    async function getUserAndProgress() {
      const session = await AuthService.getSession()
      if (session?.user) {
        setUser(session.user)
        try {
          const [enrollments, profile] = await Promise.all([
            CourseService.getUserEnrollments(session.user.id),
            AuthService.getUserProfile(session.user.id)
          ])
          
          if (profile.role === 'mentor') {
            console.log('Mentors are restricted from the learn page, redirecting...')
            router.push('/courses')
            return
          }

          setStudentName(profile.full_name)
          const currentEnrollment = enrollments.find(e => e.course_id === courseId)
          if (currentEnrollment) {
            setCompletedLessonIds(currentEnrollment.completed_lessons || [])
            setEnrollmentStatus(currentEnrollment.status)

            if (currentEnrollment.status === 'completed') {
              const certData = await CertificateService.getCertificateByCourseId(courseId)
              setCertificate(certData)
            }
          } else if (profile.role === 'student') {
            // Auto-enroll student if they land on the learn page but aren't enrolled yet
            console.log('Student not enrolled, auto-enrolling...')
            try {
              await CourseService.enrollCourse(session.user.id, courseId)
              setCompletedLessonIds([])
              setEnrollmentStatus('enrolled')
            } catch (enrollErr) {
              console.error('Auto-enrollment failed:', enrollErr)
            }
          }
        } catch (err) {
          console.error('Error fetching progress:', err)
        }
      }
    }
    getUserAndProgress()
  }, [courseId])

  // 2. Fetch Course Content
  useEffect(() => {
    async function loadContent() {
      try {
        const [courseData, lessonData] = await Promise.all([
          CourseService.getCourseById(courseId),
          CourseService.getLessonsByCourseId(courseId)
        ])
        setCourse(courseData)
        setLessons(lessonData)
        if (lessonData.length > 0) {
          setCurrentLesson(lessonData[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadContent()
  }, [courseId])

  // 3. Check Quiz existence
  useEffect(() => {
    async function checkQuiz() {
      if (!currentLesson) return
      setCheckingQuiz(true)
      setCurrentLessonHasQuiz(false) // Reset state before checking new lesson
      try {
        const quizData = await QuizService.getQuizByLessonId(currentLesson.id)
        setCurrentLessonHasQuiz(!!(quizData && quizData.questions && quizData.questions.length > 0))
      } catch (err) {
        console.error('Error checking quiz:', err)
        setCurrentLessonHasQuiz(false)
      } finally {
        setCheckingQuiz(false)
      }
    }
    checkQuiz()
  }, [currentLesson])

  const handleDownload = async () => {
    if (!certificateRef.current) return
    setDownloading(true)
    
    try {
      const certData = certificate
      await CertificateService.downloadCertificatePDF(
        certData,
        course.title,
        studentName,
        courseId
      )
    } catch (err) {
      console.error('Download failed:', err)
      alert('Gagal mengunduh PDF. Silakan coba lagi.')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: `Sertifikat Kelulusan - ${course.title}`,
      text: `Saya baru saja lulus dari kursus "${course.title}" di SkillSpace!`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link kursus telah disalin ke clipboard!')
      }
    } catch (err) {
      console.error('Share failed:', err)
    }
  }

  const handleMarkAsCompleted = async () => {
    if (!user || !currentLesson) return
    try {
      await QuizService.markLessonAsCompleted(user.id, currentLesson.id)
      handleQuizComplete()
    } catch (err: any) {
      console.error('Error marking as completed:', {
        message: err?.message || 'No message',
        details: err?.details || 'No details',
        hint: err?.hint || 'No hint',
        code: err?.code || 'No code',
        fullError: err
      })
      alert(`Gagal menandai materi sebagai selesai: ${err?.message || 'Unknown error'}`)
    }
  }

  const scrollToDiscussion = (tab: 'public' | 'private') => {
    setDiscussionTab(tab)
    // Small delay to ensure tab state is updated if needed
    setTimeout(() => {
      discussionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleQuizComplete = async () => {
    if (!currentLesson) return
    
    // 1. Update local progress immediately
    let newCompletedIds = completedLessonIds
    if (!completedLessonIds.includes(currentLesson.id)) {
      newCompletedIds = [...completedLessonIds, currentLesson.id]
      setCompletedLessonIds(newCompletedIds)
    }

    // 2. Check if whole course is now finished
    if (lessons.length > 0 && newCompletedIds.length >= lessons.length) {
      setEnrollmentStatus('completed')
      // Fetch certificate design if not already fetched
      if (!certificate) {
        const certData = await CertificateService.getCertificateByCourseId(courseId)
        setCertificate(certData)
      }
    }

    setShowQuiz(false)
  }

  // Helper untuk mengekstrak ID Video YouTube
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Menyiapkan Ruang Belajar...</p>
    </div>
  )
  
  if (!course) return (
    <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-6 bg-gray-50">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center">
        <Lock size={40} />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 max-w-xs mx-auto">Kursus tidak ditemukan atau Anda tidak memiliki akses ke materi ini.</p>
      </div>
      <Link href="/courses">
        <Button variant="outline">Kembali ke Katalog</Button>
      </Link>
    </div>
  )

  const progressPercentage = lessons.length > 0 
    ? Math.round((completedLessonIds.length / lessons.length) * 100) 
    : 0

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* Sidebar Daftar Pelajaran */}
      <div className="w-96 bg-gray-50/50 border-r border-gray-100 flex flex-col shadow-xl shadow-gray-200/20 z-10 relative">
        <div className="p-8 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <Link href={user?.role === 'mentor' ? "/dashboard/mentor" : "/dashboard/student"} className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-300">
              <ArrowLeft size={18} />
            </Link>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Kembali ke Dashboard</span>
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-2">{course.title}</h2>
          <Link 
            href={`/mentors/${course.mentor_id}`} 
            className="flex items-center gap-2 mb-6 group/mentor hover:opacity-80 transition-all"
          >
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover/mentor:bg-blue-600 group-hover/mentor:text-white transition-colors">
              <User size={12} />
            </div>
            <div className="text-sm font-bold text-gray-400 group-hover/mentor:text-blue-600 transition-colors">
              {course.profiles?.full_name}
              <span className="text-[8px] ml-2 bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-tighter">Profil</span>
            </div>
          </Link>

          <div className="space-y-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Progres Belajar</span>
              <span className="text-xs font-black text-blue-600">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-4">Kurikulum Kursus</h3>
          {lessons.map((lesson, index) => {
            const isActive = currentLesson?.id === lesson.id
            const isCompleted = completedLessonIds.includes(lesson.id)
            
            return (
              <button
                key={lesson.id}
                onClick={() => setCurrentLesson(lesson)}
                className={`group w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden border-2 ${
                  isActive 
                  ? 'bg-white border-blue-600 shadow-lg shadow-blue-500/10' 
                  : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'
                }`}
              >
                {isCompleted && !isActive && (
                  <div className="absolute top-0 right-0 p-1.5 bg-emerald-500 text-white rounded-bl-xl">
                    <CheckCircle2 size={12} />
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs transition-all duration-300 ${
                    isActive 
                    ? 'bg-blue-600 text-white rotate-6' 
                    : isCompleted
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={18} /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      Materi {index + 1}
                    </div>
                    <div className={`font-bold text-sm truncate transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      {lesson.title}
                    </div>
                  </div>
                  {isActive && <ChevronRight size={18} className="text-blue-600 animate-in slide-in-from-left-2" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Konten Utama (Video & Materi) */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        {user?.role === 'mentor' ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-500/10">
              <Lock size={48} />
            </div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Materi Khusus Siswa</h3>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed font-medium">
              Maaf, sebagai Mentor Anda hanya dapat melihat struktur kurikulum. 
              Materi video, dokumen, dan kuis hanya dapat diakses oleh akun Siswa.
            </p>
            <div className="mt-10 flex gap-4">
              <Link href="/courses">
                <Button variant="outline" className="rounded-2xl px-8">Kembali ke Katalog</Button>
              </Link>
              <Link href="/dashboard/mentor">
                <Button className="rounded-2xl px-8 shadow-lg shadow-blue-500/20">Dashboard Mentor</Button>
              </Link>
            </div>
          </div>
        ) : currentLesson ? (
          <div className="max-w-5xl mx-auto p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Certificate Section for Completed Students */}
            {enrollmentStatus === 'completed' && (
              <div className="space-y-6 animate-in zoom-in duration-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Award size={20} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Sertifikat Kelulusan</h3>
                </div>

                <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden relative group/cert-container">
                  <div ref={certificateRef} className="aspect-[1.414/1] w-full rounded-[2rem] overflow-hidden relative bg-gray-50">
                    {/* Dynamic Certificate Template */}
                    {certificate && certificate.template_url ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img 
                          src={mounted ? `${certificate.template_url}?t=${new Date(certificate.created_at).getTime()}` : certificate.template_url} 
                          className="w-full h-full object-cover"
                          alt="Certificate Background"
                        />
                        {/* Semi-transparent overlay to ensure text readability if needed */}
                        <div className="absolute inset-0 bg-white/10" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-white border-[20px]" style={{ borderColor: (certificate?.primary_color || '#2563eb') + '15' }}>
                         <div className="absolute inset-[15px] border-2 border-dashed" style={{ borderColor: (certificate?.primary_color || '#2563eb') + '30' }} />
                      </div>
                    )}

                    <div className="relative h-full flex flex-col items-center justify-center p-8 md:p-16 text-center z-10">
                       <div className="mb-6" style={{ color: certificate?.primary_color || '#2563eb' }}>
                          <Award size={64} strokeWidth={1.5} />
                       </div>
                       
                       <h2 className="text-2xl md:text-4xl font-black mb-4 tracking-tighter uppercase" style={{ color: certificate?.primary_color || '#2563eb' }}>
                          {certificate?.title_text || 'Sertifikat Kelulusan'}
                       </h2>

                       <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px] mb-6 md:mb-10">
                          {certificate?.description_text || 'Dengan ini menyatakan bahwa'}
                       </p>

                       <div className="w-full max-w-md border-b-2 border-gray-200 pb-2 mb-4">
                          <span className="text-3xl md:text-5xl font-serif italic text-gray-900">{studentName || 'Siswa SkillSpace'}</span>
                       </div>

                       <div className="text-gray-500 text-xs md:text-sm font-medium mb-8 md:mb-12 max-w-sm leading-relaxed">
                          Telah berhasil menyelesaikan seluruh kurikulum dan evaluasi pada kursus
                          <span className="block font-black text-gray-800 mt-1">"{course.title}"</span>
                       </div>

                       <div className="mt-auto flex justify-between w-full items-end px-4 md:px-12">
                          <div className="text-left space-y-1">
                             <div className="h-px w-24 md:w-32 bg-gray-200" />
                             <p className="text-[6px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest">ID: SS-{courseId.slice(0,8).toUpperCase()}</p>
                             <p className="text-[6px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest" suppressHydrationWarning>Tgl: {mounted ? new Date().toLocaleDateString('id-ID') : ''}</p>
                          </div>
                          
                          <div className="text-right">
                             <p className="font-serif italic text-lg md:text-xl text-gray-900 mb-1">{certificate?.signature_name || course.profiles?.full_name}</p>
                             <div className="h-px w-32 md:w-48 bg-gray-300 ml-auto mb-2" />
                             <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Mentor Pengajar</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50 rounded-b-[2rem]">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                          <Sparkles size={16} />
                       </div>
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Selamat! Anda telah lulus kursus ini.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                       <Button 
                        variant="outline" 
                        onClick={handleShare}
                        className="flex-1 md:flex-none gap-2 rounded-xl text-xs font-black uppercase tracking-widest"
                       >
                          <Share2 size={14} /> Bagikan
                       </Button>
                       <Button 
                        onClick={handleDownload}
                        isLoading={downloading}
                        className="flex-1 md:flex-none gap-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                       >
                          <Download size={14} /> Download PDF
                       </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-50 text-blue-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    Materi Aktif
                  </span>
                  {completedLessonIds.includes(currentLesson.id) && (
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={12} /> Sudah Selesai
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">{currentLesson.title}</h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-white">
                  <MoreVertical size={18} />
                </Button>
              </div>
            </div>
            
            {/* Video Content */}
            {currentLesson.youtube_url && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                  <PlayCircle size={14} className="text-red-500" />
                  Video Pembelajaran
                </div>
                <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/10 ring-1 ring-gray-200 border-4 border-white">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYoutubeId(currentLesson.youtube_url)}?modestbranding=1&rel=0`}
                    title={currentLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Konten Teks & Tombol Aksi */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-gray-50 opacity-50 select-none pointer-events-none">
                    <BookOpen size={120} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                      Deskripsi Materi
                    </h3>
                    <div className="prose prose-blue max-w-none text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {currentLesson.content}
                    </div>

                    {currentLesson.pdf_url && (
                      <div className="mt-10 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 group/pdf">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover/pdf:rotate-6 transition-transform">
                            <FileText size={28} />
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 tracking-tight">Materi Pendukung (PDF)</h4>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Dokumen Pembelajaran</p>
                          </div>
                        </div>
                        <a 
                          href={currentLesson.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-sm shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 group/btn"
                        >
                          <Download size={18} className="group-hover/btn:translate-y-0.5 transition-transform" />
                          Download PDF
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bagian Diskusi */}
                {user && (
                  <div ref={discussionRef}>
                    <DiscussionSection 
                      lessonId={currentLesson.id} 
                      userId={user.id} 
                      initialTab={discussionTab}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-8 sticky top-8">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                      {completedLessonIds.includes(currentLesson.id) ? <CheckCircle2 size={24} className="text-emerald-400" /> : <CheckCircle2 size={24} />}
                    </div>
                    <h4 className="font-black text-2xl tracking-tight mb-2">Evaluasi Belajar</h4>
                    <p className="text-blue-100 text-sm font-medium mb-8 leading-relaxed">
                      {completedLessonIds.includes(currentLesson.id) 
                        ? 'Anda telah menyelesaikan materi ini. Anda dapat mengulangi kuis kapan saja.'
                        : currentLessonHasQuiz 
                          ? 'Selesaikan kuis untuk memverifikasi pemahaman Anda dan tandai materi ini sebagai selesai.'
                          : 'Tandai materi ini sebagai selesai untuk melanjutkan progres belajar Anda.'}
                    </p>
                    
                    {currentLessonHasQuiz ? (
                      <Button 
                        variant="secondary" 
                        onClick={() => setShowQuiz(true)}
                        className="w-full py-4 rounded-2xl shadow-xl shadow-blue-900/20 font-black text-blue-700"
                      >
                        {completedLessonIds.includes(currentLesson.id) ? 'Ulangi Kuis' : 'Mulai Kuis Sekarang'}
                      </Button>
                    ) : (
                      <Button 
                        variant={completedLessonIds.includes(currentLesson.id) ? 'outline' : 'secondary'}
                        onClick={handleMarkAsCompleted}
                        disabled={completedLessonIds.includes(currentLesson.id) || checkingQuiz}
                        className={`w-full py-4 rounded-2xl font-black ${completedLessonIds.includes(currentLesson.id) ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white text-blue-700 shadow-xl'}`}
                      >
                        {checkingQuiz ? 'Memeriksa...' : completedLessonIds.includes(currentLesson.id) ? 'Selesai ✓' : 'Tandai Selesai'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20">
                  <h4 className="font-black text-gray-900 mb-6 tracking-tight">Butuh Bantuan?</h4>
                  <div className="space-y-4">
                    <button 
                      onClick={() => scrollToDiscussion('private')}
                      className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <MessageSquare size={20} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black uppercase tracking-widest text-gray-400">Hubungi</div>
                        <div className="text-sm font-bold text-gray-700">Tanya Mentor</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showQuiz && (
              <QuizModal 
                lessonId={currentLesson.id} 
                onClose={() => setShowQuiz(false)} 
                onComplete={handleQuizComplete}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-6 bg-gray-50/30">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-blue-100">
              <PlayCircle size={64} />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Pilih Materi Belajar</h3>
              <p className="text-gray-500 max-w-xs mx-auto">Klik salah satu materi di sidebar kiri untuk memulai perjalanan belajar Anda.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Minimal placeholder for missing icons
const MessageSquare = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
)
