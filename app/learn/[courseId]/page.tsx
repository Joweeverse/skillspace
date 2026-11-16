"use client"

import React, { useEffect, useState, useRef } from 'react'
import { CourseService } from '@/services/courseService'
import { Lesson, Certificate } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { DiscussionSection } from '@/components/features/DiscussionSection'
import { QuizModal } from '@/components/features/QuizModal'
import { AuthService } from '@/services/authService'
import { QuizService } from '@/services/quizService'
import { CertificateService } from '@/services/certificateService'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  PlayCircle,
  Lock,
  ArrowLeft,
  User,
  Download,
  FileText,
  Award,
  Sparkles,
  Share2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react'

/* ─── Sidebar lesson row ─────────────────────────────────────── */
function LessonRow({
  lesson,
  index,
  isActive,
  isCompleted,
  isLocked,
  onClick,
}: {
  lesson: Lesson
  index: number
  isActive: boolean
  isCompleted: boolean
  isLocked: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      aria-current={isActive ? 'page' : undefined}
      className={`group w-full text-left rounded-2xl px-3 py-3 min-h-11 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${
        isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
          : isLocked
          ? 'opacity-50'
          : 'hover:bg-gray-100 dark:hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
            isActive
              ? 'bg-white/20 text-white'
              : isCompleted
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400'
              : isLocked
              ? 'bg-gray-100 text-gray-300 dark:bg-slate-800 dark:text-slate-600'
              : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400'
          }`}
          aria-label={isCompleted ? 'Completed' : isLocked ? 'Locked' : `Lesson ${index + 1}`}
        >
          {isCompleted ? (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          ) : isLocked ? (
            <Lock className="size-3.5" aria-hidden="true" />
          ) : (
            index + 1
          )}
        </span>

        {/* Title */}
        <span className={`flex-1 truncate text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700 dark:text-slate-300'}`}>
          {lesson.title}
        </span>

        {isActive && <ChevronRight className="size-4 shrink-0 text-white/70" aria-hidden="true" />}
      </div>
    </button>
  )
}

/* ─── Quiz state panel ───────────────────────────────────────── */
type QuizState = 'checking' | 'none' | 'locked' | 'ready' | 'passed'

function QuizPanel({
  state,
  score,
  onStart,
  onNext,
  hasNext,
}: {
  state: QuizState
  score?: number
  onStart: () => void
  onNext: () => void
  hasNext: boolean
}) {
  if (state === 'checking') {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 py-10">
        <div className="size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" role="status" aria-label="Checking quiz" />
      </div>
    )
  }

  if (state === 'none') return null

  if (state === 'locked') {
    return (
      <section aria-label="Quiz locked" className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-xs py-2">
          <ImageSlot src="/illustrations/quiz-locked.svg" alt="Quiz locked — finish the lesson first" aspectRatio="4 / 3" />
        </div>
        <div className="border-t border-gray-100 dark:border-slate-800 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
            Finish reading all material above to unlock the quiz.
          </p>
        </div>
      </section>
    )
  }

  if (state === 'passed') {
    return (
      <section aria-label="Quiz passed" className="overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 shadow-sm">
        <div className="mx-auto max-w-xs py-2">
          <ImageSlot src="/illustrations/quiz-passed.svg" alt="Quiz passed celebration" aspectRatio="4 / 3" />
        </div>
        <div className="border-t border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/40 px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-bold text-emerald-700 dark:text-emerald-300">Quiz passed!</span>
            {score !== undefined && (
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {score}%
              </span>
            )}
          </div>
          <p className="mb-4 text-sm text-emerald-800/70 dark:text-emerald-400/80">
            Great work. This lesson is marked as complete.
          </p>
          {hasNext && (
            <Button size="sm" className="w-full" onClick={onNext} rightIcon={<ChevronRight className="size-4" aria-hidden="true" />}>
              Next Lesson
            </Button>
          )}
        </div>
      </section>
    )
  }

  /* state === 'ready' */
  return (
    <section aria-label="Quiz available" className="overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-sm">
      <div className="mx-auto max-w-xs py-2">
        <ImageSlot src="/illustrations/quiz-ready.svg" alt="Quiz is ready to start" aspectRatio="4 / 3" />
      </div>
      <div className="border-t border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/40 px-5 py-5">
        <div className="mb-1 flex items-center gap-2">
          <HelpCircle className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span className="font-bold text-blue-800 dark:text-blue-300">Quiz available</span>
        </div>
        <p className="mb-4 text-sm text-blue-700/70 dark:text-blue-300/70">
          Score ≥&thinsp;50% to mark this lesson complete and unlock the next one.
        </p>
        <Button size="sm" className="w-full" onClick={onStart}>
          Start Quiz
        </Button>
      </div>
    </section>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
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
  const [sidebarOpen, setSidebarOpen] = useState(false)   // mobile collapse
  const [lastScore, setLastScore] = useState<number | undefined>(undefined)

  const certificateRef = useRef<HTMLDivElement>(null)
  const discussionRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  /* 1. User + progress */
  useEffect(() => {
    async function getUserAndProgress() {
      const session = await AuthService.getSession()
      if (session?.user) {
        setUser(session.user)
        try {
          const [enrollments, profile] = await Promise.all([
            CourseService.getUserEnrollments(session.user.id),
            AuthService.getUserProfile(session.user.id),
          ])
          setStudentName(profile.full_name)
          const enr = enrollments.find((e: any) => e.course_id === courseId)
          if (enr) {
            setCompletedLessonIds(enr.completed_lessons || [])
            setEnrollmentStatus(enr.status)
            if (enr.status === 'completed') {
              const certData = await CertificateService.getCertificateByCourseId(courseId)
              setCertificate(certData)
            }
          } else if (profile.role === 'student') {
            try {
              await CourseService.enrollCourse(session.user.id, courseId)
              setCompletedLessonIds([])
              setEnrollmentStatus('enrolled')
            } catch { /* ignore */ }
          }
        } catch (err) { console.error('Error fetching progress:', err) }
      }
    }
    getUserAndProgress()
  }, [courseId])

  /* 2. Course content */
  useEffect(() => {
    async function loadContent() {
      try {
        const [courseData, lessonData] = await Promise.all([
          CourseService.getCourseById(courseId),
          CourseService.getLessonsByCourseId(courseId),
        ])
        setCourse(courseData)
        setLessons(lessonData)
        if (lessonData.length > 0) setCurrentLesson(lessonData[0])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    loadContent()
  }, [courseId])

  /* 3. Quiz check per lesson */
  useEffect(() => {
    async function checkQuiz() {
      if (!currentLesson) return
      setCheckingQuiz(true)
      setCurrentLessonHasQuiz(false)
      setLastScore(undefined)
      try {
        const quizData = await QuizService.getQuizByLessonId(currentLesson.id)
        setCurrentLessonHasQuiz(!!(quizData?.questions?.length))
      } catch { setCurrentLessonHasQuiz(false) }
      finally { setCheckingQuiz(false) }
    }
    checkQuiz()
  }, [currentLesson])

  const handleDownload = async () => {
    if (!certificateRef.current) return
    setDownloading(true)
    try {
      await CertificateService.downloadCertificatePDF(certificate, course.title, studentName, courseId)
    } catch { alert('Download failed. Please try again.') }
    finally { setDownloading(false) }
  }

  const handleShare = async () => {
    const shareData = {
      title: `Certificate – ${course.title}`,
      text: `I just completed "${course.title}" on SkillSpace!`,
      url: window.location.href,
    }
    try {
      if (navigator.share) await navigator.share(shareData)
      else { await navigator.clipboard.writeText(window.location.href); alert('Link copied!') }
    } catch { /* ignore */ }
  }

  const handleMarkAsCompleted = async () => {
    if (!user || !currentLesson) return
    try {
      await QuizService.markLessonAsCompleted(user.id, currentLesson.id)
      handleQuizComplete()
    } catch (err: any) {
      alert(`Failed to mark complete: ${err?.message ?? 'Unknown error'}`)
    }
  }

  const handleQuizComplete = async (score?: number) => {
    if (!currentLesson) return
    setLastScore(score)
    let newCompletedIds = completedLessonIds
    if (!completedLessonIds.includes(currentLesson.id)) {
      newCompletedIds = [...completedLessonIds, currentLesson.id]
      setCompletedLessonIds(newCompletedIds)
    }
    if (lessons.length > 0 && newCompletedIds.length >= lessons.length) {
      setEnrollmentStatus('completed')
      if (!certificate) {
        const certData = await CertificateService.getCertificateByCourseId(courseId)
        setCertificate(certData)
      }
    }
    setShowQuiz(false)
  }

  const goToNextLesson = () => {
    if (!currentLesson) return
    const idx = lessons.findIndex((l) => l.id === currentLesson.id)
    if (idx < lessons.length - 1) setCurrentLesson(lessons[idx + 1])
  }

  const getYoutubeId = (url: string) => {
    const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/)
    return m && m[2].length === 11 ? m[2] : null
  }

  const scrollToDiscussion = (tab: 'public' | 'private') => {
    setDiscussionTab(tab)
    setTimeout(() => discussionRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  /* Derived values */
  const completedCount = completedLessonIds.length
  const totalCount = lessons.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const currentIndex = currentLesson ? lessons.findIndex((l) => l.id === currentLesson.id) : -1
  const hasNext = currentIndex >= 0 && currentIndex < lessons.length - 1

  const isCurrentCompleted = !!(currentLesson && completedLessonIds.includes(currentLesson.id))

  /* Quiz panel state */
  const quizState: QuizState = checkingQuiz
    ? 'checking'
    : !currentLessonHasQuiz
    ? 'none'
    : isCurrentCompleted
    ? 'passed'
    : 'ready'

  /* ── Loading / error states ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4 bg-gray-50">
      <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">Loading your classroom…</p>
    </div>
  )

  if (!course) return (
    <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-6 bg-gray-50 p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
        <Lock className="size-10" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-1 max-w-xs text-gray-500">Course not found or you don&apos;t have access.</p>
      </div>
      <Link href="/courses"><Button as="div" variant="outline">Back to Catalog</Button></Link>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-200">

      {/* ── Slim top progress bar ── */}
      <div className="relative h-1.5 w-full bg-gray-100 dark:bg-slate-800" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${completedCount} of ${totalCount} lessons completed`}>
        <div
          className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Progress label (desktop only) ── */}
      <div className="hidden shrink-0 items-center justify-end gap-2 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 sm:flex">
        <span className="font-bold text-blue-600 dark:text-blue-400">{completedCount}</span>
        <span>of {totalCount} lessons completed</span>
        <span className="ml-1 rounded-full bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-300">{progressPct}%</span>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ════════════════════════════════════════
            SIDEBAR — desktop left / mobile bottom
            ════════════════════════════════════════ */}
        <aside
          className="hidden w-72 shrink-0 flex-col border-r border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 lg:flex xl:w-80"
          aria-label="Course curriculum"
        >
          {/* Sidebar header */}
          <div className="border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4">
            <Link
              href={user?.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/student'}
              className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Dashboard
            </Link>
            <h2 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-gray-900 dark:text-slate-100">
              {course.title}
            </h2>
            <Link
              href={`/mentors/${course.mentor_id}`}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <User className="size-3.5" aria-hidden="true" />
              {course.profiles?.full_name}
            </Link>
          </div>

          {/* Lesson list */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400">Curriculum</p>
            <nav aria-label="Lessons">
              {lessons.map((lesson, idx) => {
                const done = completedLessonIds.includes(lesson.id)
                /* A lesson is locked if the previous one has a quiz and isn't complete */
                const prevDone = idx === 0 || completedLessonIds.includes(lessons[idx - 1].id)
                return (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={idx}
                    isActive={currentLesson?.id === lesson.id}
                    isCompleted={done}
                    isLocked={!prevDone && !done}
                    onClick={() => setCurrentLesson(lesson)}
                  />
                )
              })}
            </nav>
          </div>
        </aside>

        {/* ════════════════════════════════════════
            MAIN CONTENT
            ════════════════════════════════════════ */}
        <main className="flex flex-1 flex-col overflow-y-auto" id="main-content">

          {/* Mentor view — read-only notice */}
          {user?.role === 'mentor' ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-400">
                <Lock className="size-10" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Student-only content</h3>
                <p className="mt-2 max-w-sm text-gray-500">
                  Videos, documents, and quizzes are only accessible to enrolled students. You can preview the curriculum from the sidebar.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/courses"><Button as="div" variant="outline">Back to Catalog</Button></Link>
                <Link href="/dashboard/mentor"><Button as="div">Mentor Dashboard</Button></Link>
              </div>
            </div>

          ) : currentLesson ? (
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

              {/* ── Mobile: back + curriculum toggle ── */}
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <Link
                  href={user?.role === 'mentor' ? '/dashboard/mentor' : '/dashboard/student'}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Dashboard
                </Link>
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  aria-expanded={sidebarOpen}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Curriculum
                  <ChevronDown
                    className={`size-3.5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* ── Mobile collapsible curriculum ── */}
              {sidebarOpen && (
                <nav
                  className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm lg:hidden"
                  aria-label="Course curriculum (mobile)"
                >
                  <div className="px-3 py-2">
                    {lessons.map((lesson, idx) => {
                      const done = completedLessonIds.includes(lesson.id)
                      const prevDone = idx === 0 || completedLessonIds.includes(lessons[idx - 1].id)
                      return (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          index={idx}
                          isActive={currentLesson?.id === lesson.id}
                          isCompleted={done}
                          isLocked={!prevDone && !done}
                          onClick={() => { setCurrentLesson(lesson); setSidebarOpen(false) }}
                        />
                      )
                    })}
                  </div>
                </nav>
              )}

              {/* ── Certificate (course completed) ── */}
              {enrollmentStatus === 'completed' && (
                <section aria-label="Completion certificate" className="mb-10">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/60 p-2 text-amber-600 dark:text-amber-400">
                      <Award className="size-5" aria-hidden="true" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Your Certificate</h2>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/8">
                    <div ref={certificateRef} className="aspect-[1.414/1] w-full bg-gray-50 dark:bg-slate-950 relative">
                      {certificate?.template_url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mounted ? `${certificate.template_url}?t=${new Date(certificate.created_at ?? '').getTime()}` : certificate.template_url}
                            className="absolute inset-0 size-full object-cover"
                            alt="Certificate background"
                          />
                          <div className="absolute inset-0 bg-white/10" />
                        </>
                      ) : (
                        <div
                          className="absolute inset-0 border-[20px]"
                          style={{ borderColor: (certificate?.primary_color || '#2563eb') + '15' }}
                        >
                          <div
                            className="absolute inset-[12px] border-2 border-dashed"
                            style={{ borderColor: (certificate?.primary_color || '#2563eb') + '30' }}
                          />
                        </div>
                      )}

                      <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center md:p-14">
                        <div className="mb-4" style={{ color: certificate?.primary_color || '#2563eb' }}>
                          <Award className="mx-auto size-14 md:size-16" strokeWidth={1.5} aria-hidden="true" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight md:text-4xl" style={{ color: certificate?.primary_color || '#2563eb' }}>
                          {certificate?.title_text || 'Certificate of Completion'}
                        </h2>
                        <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 md:text-xs">
                          {certificate?.description_text || 'This certifies that'}
                        </p>
                        <div className="mt-4 w-full max-w-xs border-b-2 border-gray-200 pb-2">
                          <span className="text-2xl font-serif italic text-gray-900 md:text-4xl">{studentName || 'Student'}</span>
                        </div>
                        <p className="mt-4 max-w-xs text-xs text-gray-500 md:text-sm">
                          has successfully completed <strong className="text-gray-800">&ldquo;{course.title}&rdquo;</strong>
                        </p>
                        <div className="mt-auto flex w-full justify-between px-4 pt-6 md:px-10">
                          <div className="text-left">
                            <div className="h-px w-24 bg-gray-200" />
                            <p className="mt-1 text-[7px] font-bold uppercase tracking-widest text-gray-400 md:text-[9px]" suppressHydrationWarning>
                              {mounted ? new Date().toLocaleDateString('id-ID') : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif italic text-base text-gray-900 md:text-xl">{certificate?.signature_name || course.profiles?.full_name}</p>
                            <div className="ml-auto mt-1 h-px w-32 bg-gray-300 md:w-44" />
                            <p className="mt-1 text-[7px] font-bold uppercase tracking-widest text-gray-400 md:text-[9px]">Lead Mentor</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/60 px-5 py-4 sm:flex-row">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-500" aria-hidden="true" />
                        <span className="text-xs font-semibold text-gray-600">Congratulations! You completed this course.</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleShare} leftIcon={<Share2 className="size-3.5" aria-hidden="true" />}>
                          Share
                        </Button>
                        <Button size="sm" isLoading={downloading} onClick={handleDownload} leftIcon={<Download className="size-3.5" aria-hidden="true" />}>
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* ── Lesson header ── */}
              <header className="mb-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 dark:bg-blue-950/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                    Lesson {currentIndex + 1}
                  </span>
                  {isCurrentCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      Completed
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-950 dark:text-slate-100 sm:text-4xl">
                  {currentLesson.title}
                </h1>
              </header>

              {/* ── Video or reading placeholder ── */}
              {currentLesson.youtube_url ? (
                <section aria-label="Lesson video" className="mb-8">
                  <div className="overflow-hidden rounded-2xl bg-black shadow-xl shadow-blue-900/10 ring-1 ring-gray-200 dark:ring-slate-800">
                    <div className="aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${getYoutubeId(currentLesson.youtube_url)}?modestbranding=1&rel=0`}
                        title={currentLesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </section>
              ) : (
                <div className="mb-8 overflow-hidden rounded-2xl border border-blue-100 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-900/80">
                  <ImageSlot
                    src="/illustrations/lesson-reading.svg"
                    alt="Reading lesson — no video for this lesson"
                    aspectRatio="16 / 7"
                  />
                </div>
              )}

              {/* ── Text content ── */}
              <section aria-label="Lesson content" className="mb-8">
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-6 shadow-sm sm:px-8">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400 dark:text-slate-400">
                    <div className="size-1 h-5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-500" aria-hidden="true" />
                    Lesson material
                  </h2>
                  <div className="prose prose-sm prose-blue max-w-[65ch] leading-7 text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                    {currentLesson.content}
                  </div>
                </div>
              </section>

              {/* ── PDF download ── */}
              {currentLesson.pdf_url && (
                <section aria-label="Supplementary PDF" className="mb-8">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-100 dark:border-slate-800 bg-blue-50/60 dark:bg-slate-900 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow shadow-blue-500/30">
                        <FileText className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Supplementary PDF</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">Reading material for this lesson</p>
                      </div>
                    </div>
                    <a
                      href={currentLesson.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 shadow-sm hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:border-blue-600 transition-all focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download
                    </a>
                  </div>
                </section>
              )}

              {/* ── Quiz section ── */}
              <section aria-label="Lesson quiz" className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400 dark:text-slate-400">
                  <div className="size-1 h-5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-500" aria-hidden="true" />
                  Knowledge check
                </h2>

                {/* No quiz — simple mark-complete button */}
                {!checkingQuiz && !currentLessonHasQuiz && (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${isCurrentCompleted ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'}`}>
                        <CheckCircle2 className="size-5" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        {isCurrentCompleted ? 'This lesson is marked as complete.' : 'No quiz for this lesson — mark it complete to continue.'}
                      </p>
                    </div>
                    {!isCurrentCompleted && (
                      <Button size="sm" onClick={handleMarkAsCompleted}>
                        Mark Complete
                      </Button>
                    )}
                    {isCurrentCompleted && hasNext && (
                      <Button size="sm" onClick={goToNextLesson} rightIcon={<ChevronRight className="size-4" aria-hidden="true" />}>
                        Next Lesson
                      </Button>
                    )}
                  </div>
                )}

                {/* Quiz panel */}
                <QuizPanel
                  state={quizState}
                  score={lastScore}
                  onStart={() => setShowQuiz(true)}
                  onNext={goToNextLesson}
                  hasNext={hasNext}
                />
              </section>

              {/* ── Help / discussion ── */}
              <section aria-label="Discussions" className="mb-8">
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-sm">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <MessageSquare className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Need help?</p>
                    <p className="text-xs text-gray-500">Ask a question or message your mentor privately.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => scrollToDiscussion('public')}
                      className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500"
                    >
                      Forum
                    </button>
                    <button
                      onClick={() => scrollToDiscussion('private')}
                      className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500"
                    >
                      Mentor DM
                    </button>
                  </div>
                </div>

                {user && (
                  <div ref={discussionRef} className="mt-4">
                    <DiscussionSection lessonId={currentLesson.id} userId={user.id} initialTab={discussionTab} />
                  </div>
                )}
              </section>

            </div>

          ) : (
            /* No lesson selected */
            <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-200">
                <PlayCircle className="size-10" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select a lesson</h3>
                <p className="mt-1 max-w-xs text-sm text-gray-500">
                  Pick a lesson from the curriculum to start learning.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Quiz modal ── */}
      {showQuiz && currentLesson && (
        <QuizModal
          lessonId={currentLesson.id}
          onClose={() => setShowQuiz(false)}
          onComplete={(score) => handleQuizComplete(score)}
        />
      )}
    </div>
  )
}
