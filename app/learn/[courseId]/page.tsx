"use client"

import React, { useEffect, useState, use } from 'react'
import { CourseService } from '@/services/courseService'
import { Lesson } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { DiscussionSection } from '@/components/features/DiscussionSection'
import { QuizModal } from '@/components/features/QuizModal'
import { AuthService } from '@/services/authService'
import { ChevronRight, CheckCircle2, PlayCircle, FileText, Lock, ArrowLeft, MoreVertical, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([])
  const [discussionTab, setDiscussionTab] = useState<'public' | 'private'>('public')

  const discussionRef = React.useRef<HTMLDivElement>(null)

  const scrollToDiscussion = (tab: 'public' | 'private') => {
    setDiscussionTab(tab)
    discussionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    async function getUserAndProgress() {
      const session = await AuthService.getSession()
      if (session?.user) {
        setUser(session.user)
        try {
          const enrollments = await CourseService.getUserEnrollments(session.user.id)
          const currentEnrollment = enrollments.find(e => e.course_id === courseId)
          if (currentEnrollment) {
            setCompletedLessonIds(currentEnrollment.completed_lessons || [])
          }
        } catch (err) {
          console.error('Error fetching progress:', err)
        }
      }
    }
    getUserAndProgress()
  }, [courseId])

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

  const handleQuizComplete = () => {
    if (currentLesson && !completedLessonIds.includes(currentLesson.id)) {
      setCompletedLessonIds(prev => [...prev, currentLesson.id])
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
            <Link href="/dashboard/student" className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all duration-300">
              <ArrowLeft size={18} />
            </Link>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Kembali ke Dashboard</span>
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-2">{course.title}</h2>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <BookOpen size={12} />
            </div>
            <p className="text-sm font-bold text-gray-400">{course.profiles?.full_name}</p>
          </div>

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
        {currentLesson ? (
          <div className="max-w-5xl mx-auto p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            
            {/* Video & PDF Grid */}
            <div className={`grid gap-8 ${currentLesson.pdf_url ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Video Player */}
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

              {/* PDF Viewer */}
              {currentLesson.pdf_url && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    <FileText size={14} className="text-blue-500" />
                    Bahan Bacaan (PDF)
                  </div>
                  <div className="aspect-video xl:aspect-auto bg-gray-100 rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/10 ring-1 ring-gray-200 border-4 border-white">
                    <iframe
                      src={`${currentLesson.pdf_url}#toolbar=0`}
                      width="100%"
                      height="100%"
                      className="min-h-[400px]"
                      title="Materi PDF"
                    ></iframe>
                  </div>
                </div>
              )}
            </div>

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
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="font-black text-2xl tracking-tight mb-2">Evaluasi Belajar</h4>
                    <p className="text-blue-100 text-sm font-medium mb-8 leading-relaxed">
                      Selesaikan kuis untuk memverifikasi pemahaman Anda dan tandai materi ini sebagai selesai.
                    </p>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowQuiz(true)}
                      className="w-full py-4 rounded-2xl shadow-xl shadow-blue-900/20 font-black text-blue-700"
                    >
                      Mulai Kuis Sekarang
                    </Button>
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
