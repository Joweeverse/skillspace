'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Search,
  X,
  Palette,
  Code2,
  Briefcase,
  Megaphone,
  BarChart3,
  BookOpen,
  Layers,
  ArrowRight,
  BookOpen as BookOpenIcon,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CourseService } from '@/services/courseService'
import { AuthService } from '@/services/authService'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { Skeleton } from '@/components/ui/Skeleton'
import { CourseCard } from '@/components/features/CourseCard'
import { useToast } from '@/components/ui/Toast'

/* ─── Category filter config ─────────────────────────────────── */
const CATEGORIES = [
  { label: 'All', value: '', icon: <Layers className="size-3.5" aria-hidden="true" /> },
  { label: 'Design', value: 'design', icon: <Palette className="size-3.5" aria-hidden="true" /> },
  { label: 'Programming', value: 'programming', icon: <Code2 className="size-3.5" aria-hidden="true" /> },
  { label: 'Business', value: 'business', icon: <Briefcase className="size-3.5" aria-hidden="true" /> },
  { label: 'Marketing', value: 'marketing', icon: <Megaphone className="size-3.5" aria-hidden="true" /> },
  { label: 'Data Science', value: 'data-science', icon: <BarChart3 className="size-3.5" aria-hidden="true" /> },
]

/* ─── Skeleton card ───────────────────────────────────────────── */
function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" aria-hidden="true">
      <Skeleton variant="card" className="h-48 rounded-none" />
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-5 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <div className="flex items-center gap-2 mt-1">
          <Skeleton variant="circle" className="size-6" />
          <Skeleton className="h-3 w-28 rounded-full" />
        </div>
        <div className="mt-2 border-t border-gray-100 dark:border-slate-800 pt-4">
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function CourseCatalog() {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<any[]>([])
  const [userEnrollments, setUserEnrollments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  // Preview modal state
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
            setUserEnrollments(enrollments.map((e: any) => e.course_id))
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

  /* Client-side filter */
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        activeCategory === '' ||
        c.category?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [courses, searchQuery, activeCategory])

  const handleOpenPreview = async (courseId: string) => {
    setPreviewLoading(true)
    try {
      const data = await CourseService.getCoursePreviewData(courseId)
      setSelectedPreview(data)
    } catch (err) {
      console.error(err)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    if (!studentId) {
      router.push('/login')
      return
    }
    if (userRole === 'mentor') return

    if (userEnrollments.includes(courseId)) {
      router.push(`/learn/${courseId}`)
      return
    }

    try {
      await CourseService.enrollCourse(studentId, courseId)
      setUserEnrollments((prev) => [...prev, courseId])
      showToast('Berhasil mendaftar kursus! Selamat belajar.', 'success')
      router.push(`/learn/${courseId}`)
    } catch (err) {
      console.error(err)
      showToast('Gagal mendaftar kursus. Silakan coba lagi.', 'error')
    }
  }

  const isFiltering = searchQuery !== '' || activeCategory !== ''

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ─── BANNER ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <Container className="py-10 sm:py-14">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto] lg:gap-10">
            {/* Text */}
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">Course Catalog</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
                Find Your Next Skill
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-gray-600">
                Learn from experienced mentors across design, development, business, and beyond.
                {!loading && (
                  <span className="ml-2 font-semibold text-blue-600">
                    {courses.length} {courses.length === 1 ? 'course' : 'courses'} available.
                  </span>
                )}
              </p>
            </div>

            {/* Banner illustration */}
            <div className="hidden w-72 lg:block xl:w-80">
              <ImageSlot
                src="/illustrations/courses-banner.svg"
                alt="Student browsing courses on a screen"
                aspectRatio="9 / 5"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ─── FILTERS ─────────────────────────────────────────────── */}
      <section className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <Container className="py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">

            {/* Search input */}
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400 dark:text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, category, or mentor…"
                aria-label="Search courses"
                className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 py-2.5 pl-9 pr-9 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-10 min-w-10 flex items-center justify-center text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600 rounded-lg"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div
              className="flex gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none"
              role="group"
              aria-label="Filter by category"
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(isActive ? '' : cat.value)}
                    aria-pressed={isActive}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 min-h-10 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── GRID ────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <Container>

          {/* Result count */}
          {!loading && isFiltering && (
            <p className="mb-6 text-sm text-gray-500">
              {filteredCourses.length === 0
                ? 'No courses match your search.'
                : `${filteredCourses.length} ${filteredCourses.length === 1 ? 'course' : 'courses'} found`}
              {searchQuery && (
                <> for <span className="font-semibold text-gray-900">&ldquo;{searchQuery}&rdquo;</span></>
              )}
              {' '}
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('') }}
                className="font-semibold text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </p>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Courses grid */}
          {!loading && filteredCourses.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={userEnrollments.includes(course.id)}
                  userRole={userRole}
                  onPreview={handleOpenPreview}
                  onEnroll={handleEnroll}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredCourses.length === 0 && (
            <div className="mx-auto max-w-sm py-16 text-center">
              <div className="mx-auto w-64">
                <ImageSlot
                  src="/illustrations/empty-search.svg"
                  alt="No courses found illustration"
                  aspectRatio="5 / 4"
                />
              </div>
              <h2 className="mt-6 text-xl font-bold text-gray-950">
                {isFiltering ? 'No results found' : 'Catalog is empty'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {isFiltering
                  ? 'Try a different search term or remove some filters.'
                  : 'No courses are available yet. Check back soon.'}
              </p>
              {isFiltering && (
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('') }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition"
                >
                  <X className="size-4" aria-hidden="true" />
                  Clear filters
                </button>
              )}
            </div>
          )}
        </Container>
      </section>

      {/* ─── PREVIEW MODAL ───────────────────────────────────────── */}
      {(selectedPreview || previewLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={selectedPreview?.title ?? 'Loading preview'}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPreview(null) }}
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl">

            {previewLoading && (
              <div className="flex flex-1 items-center justify-center py-20">
                <div className="size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" role="status" aria-label="Loading preview" />
              </div>
            )}

            {!previewLoading && selectedPreview && (
              <>
                {/* Modal header */}
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 px-6 py-5 sm:px-8">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 rounded-xl bg-blue-600 p-2.5 text-white">
                      <BookOpenIcon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        {selectedPreview.category}
                      </p>
                      <h2 className="truncate text-xl font-bold text-gray-950 dark:text-slate-100">
                        {selectedPreview.title}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPreview(null)}
                    aria-label="Close preview"
                    className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Modal body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
                  <div className="grid gap-10 lg:grid-cols-3">

                    {/* Curriculum */}
                    <div className="space-y-8 lg:col-span-2">
                      <section>
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400">
                          <ArrowRight className="size-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                          Curriculum
                        </h3>
                        <div className="space-y-2">
                          {selectedPreview.lessons?.map((lesson: any, idx: number) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 p-4 hover:border-blue-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition"
                            >
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-slate-400">
                                {idx + 1}
                              </div>
                              <p className="flex-1 text-sm font-medium text-gray-700 dark:text-slate-300">{lesson.title}</p>
                              <Play className="size-3.5 text-gray-300 dark:text-slate-600 shrink-0" aria-hidden="true" />
                            </div>
                          ))}
                          {(!selectedPreview.lessons || selectedPreview.lessons.length === 0) && (
                            <p className="rounded-2xl border-2 border-dashed border-gray-100 dark:border-slate-800 p-6 text-center text-sm text-gray-400 dark:text-slate-500">
                              No lessons published yet.
                            </p>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                      {/* Mentor card */}
                      <div className="rounded-3xl bg-gray-50 dark:bg-slate-800/60 p-6 text-center space-y-3 border border-gray-100 dark:border-slate-800">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400">Mentor</p>
                        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow border border-gray-100 dark:border-slate-700 text-gray-300">
                          {selectedPreview.profiles?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={selectedPreview.profiles.avatar_url} alt="" className="size-full rounded-2xl object-cover dark:brightness-95" />
                          ) : (
                            <BookOpen className="size-7" aria-hidden="true" />
                          )}
                        </div>
                        <p className="font-bold text-gray-900 dark:text-slate-100">{selectedPreview.profiles?.full_name}</p>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800">
                          <Sparkles className="size-3 text-amber-500 dark:text-amber-400" aria-hidden="true" />
                          {selectedPreview.profiles?.points ?? 0} pts
                        </div>
                        {selectedPreview.profiles?.bio && (
                          <p className="text-xs leading-relaxed text-gray-500 dark:text-slate-400 italic">
                            &ldquo;{selectedPreview.profiles.bio}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Enroll CTA */}
                      <div className="rounded-3xl bg-blue-600 dark:bg-blue-700 p-6 text-white space-y-4 relative overflow-hidden">
                        <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                        <div className="relative">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-200">
                            <Clock className="size-3.5" aria-hidden="true" />
                            Lifetime access
                          </div>
                          <h3 className="mt-2 text-lg font-bold leading-snug">
                            {userRole === 'mentor' ? 'Mentor Preview Mode' : 'Start Learning Today'}
                          </h3>
                          <p className="mt-1 text-sm text-blue-200">
                            {userRole === 'mentor'
                              ? 'You are viewing this course as a mentor.'
                              : 'Get access to all lessons, quizzes, and a certificate.'}
                          </p>
                          {userRole !== 'mentor' && (
                            <Button
                              className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 dark:bg-white dark:text-blue-900 focus-visible:outline-white"
                              onClick={() => { handleEnroll(selectedPreview.id); setSelectedPreview(null) }}
                            >
                              Enroll Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900 px-6 py-4 sm:px-8">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500 dark:text-slate-400">
                    {['Video Access', 'Certificate', 'Discussion'].map((item) => (
                      <span key={item} className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-500" aria-hidden="true" />
                        {item}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedPreview(null)}
                    className="text-xs font-semibold text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600 transition"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
