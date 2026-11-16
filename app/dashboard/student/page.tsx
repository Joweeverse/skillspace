'use client'

import React, { useEffect, useState } from 'react'
import { CourseService } from '@/services/courseService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import { CertificateService } from '@/services/certificateService'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Trophy,
  CheckCircle2,
  ChevronRight,
  Award,
  Sparkles,
  ArrowRight,
  Download,
} from 'lucide-react'

// ------------------------------------------------------------
// Progress ring (SVG, client-only, no hydration mismatch)
// ------------------------------------------------------------
function ProgressRing({
  pct,
  size = 72,
  stroke = 7,
  finished,
}: {
  pct: number
  size?: number
  stroke?: number
  finished: boolean
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = finished ? '#10B981' : '#2563EB'

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={finished ? '#D1FAE5' : '#DBEAFE'}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease-out' }}
      />
      {/* Text is intentionally placed outside the SVG to avoid rotation issues */}
    </svg>
  )
}

// ------------------------------------------------------------
// Stat card
// ------------------------------------------------------------
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: string
}) {
  return (
    <div className={`flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-md`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900 dark:text-slate-100">{value}</div>
        <div className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// Course cover helper (same logic as CourseCard)
// ------------------------------------------------------------
function courseCoverSrc(course: { cover_url?: string; category?: string }) {
  if (course.cover_url) return course.cover_url
  const slug = (course.category ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default'
  return `/illustrations/categories/${slug}.svg`
}

// ------------------------------------------------------------
// Main page
// ------------------------------------------------------------
export default function StudentDashboard() {
  const { showToast } = useToast()
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
          AuthService.getUserProfile(session.user.id),
        ])

        setEnrollments(enrollmentData || [])
        setProfile(profileData)

        const completed = enrollmentData.filter((e: any) => e.status === 'completed')
        const certResults = await Promise.all(
          completed.map((e: any) => CertificateService.getCertificateByCourseId(e.course_id))
        )
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
    if (!user || !confirm('Apakah Anda yakin ingin mendaftar sebagai Mentor?')) return
    try {
      setLoading(true)
      await AuthService.upgradeToMentor(user.id)
      showToast('Selamat! Anda sekarang adalah seorang Mentor.', 'success')
      router.push('/dashboard/mentor')
      router.refresh()
    } catch (err: any) {
      showToast('Gagal upgrade role: ' + err.message, 'error')
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

  const activeCourses = enrollments.length
  const completedCourses = enrollments.filter(e => {
    const total = e.courses?.lessons?.length || 0
    const done = e.completed_lessons?.length || 0
    return total > 0 && done >= total
  }).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-10 md:py-12 animate-in fade-in duration-500">

      {/* ── Welcome header ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/20 dark:shadow-none p-6 md:p-10 overflow-hidden relative transition-colors duration-200">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 dark:from-slate-900/60 to-transparent pointer-events-none" />

        {/* Illustration */}
        <div className="w-full md:w-64 flex-shrink-0">
          <ImageSlot
            src="/illustrations/dashboard-student.svg"
            alt="Siswa belajar di laptop"
            aspectRatio="16/9"
            priority
          />
        </div>

        <div className="relative z-10 flex-1 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                Siswa
              </span>
              <div className="flex items-center text-blue-600 dark:text-blue-400 gap-1 animate-pulse">
                <Sparkles size={13} />
                <span className="text-[10px] font-black uppercase tracking-wider">Teruslah Belajar</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tight leading-tight">
              Halo, {profile?.full_name?.split(' ')[0] || 'Pelajar'}! 👋
            </h1>
            <p className="text-gray-500 dark:text-slate-400 font-medium mt-1 text-sm">
              Lanjutkan progres belajar Anda hari ini.
            </p>
          </div>

          {/* Stat cards */}
          <div className="flex flex-wrap gap-3">
            <StatCard
              icon={<BookOpen size={20} className="text-blue-600 dark:text-blue-400" />}
              value={activeCourses}
              label="Kursus Aktif"
              color="bg-blue-50 dark:bg-blue-950/70"
            />
            <StatCard
              icon={<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />}
              value={completedCourses}
              label="Selesai"
              color="bg-emerald-50 dark:bg-emerald-950/70"
            />
            <StatCard
              icon={<Trophy size={20} className="text-amber-500 dark:text-amber-400" />}
              value={enrollments.reduce((acc, e) => acc + (e.courses?.profiles?.points || 0), 0)}
              label="Total Poin"
              color="bg-amber-50 dark:bg-amber-950/70"
            />
          </div>
        </div>
      </div>

      {/* ── Course list ── */}
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-full" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Materi Belajar Saya</h2>
        </div>

        {/* Empty state */}
        {enrollments.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/10 dark:shadow-none flex flex-col items-center gap-6">
            <div className="w-56 max-w-full">
              <ImageSlot
                src="/illustrations/empty-learning.svg"
                alt="Belum ada kursus yang diikuti"
                aspectRatio="4/3"
              />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight mb-2">Belum Ada Aktivitas Belajar</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-xs mx-auto font-medium text-sm">
                Anda belum mendaftar di kursus apa pun. Ayo mulai belajar hal baru hari ini!
              </p>
              <Link href="/courses">
                <Button as="div" size="lg" className="px-10 py-4 rounded-[2rem] font-black shadow-xl shadow-blue-500/25" rightIcon={<ChevronRight size={18} />}>
                  Jelajahi Katalog Kursus
                </Button>
              </Link>
            </div>
          </div>
        )}

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
          const coverSrc = courseCoverSrc(course)

          return (
            <div
              key={enroll.course_id}
              className="group bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1"
            >
              <div className="flex flex-col sm:flex-row">

                {/* Cover image (4:3, fixed width on desktop) */}
                <div className="sm:w-48 md:w-56 flex-shrink-0">
                  <div className="relative h-full min-h-[140px]">
                    <ImageSlot
                      src={coverSrc}
                      alt={course.title}
                      aspectRatio="4/3"
                      rounded={false}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-6">

                  {/* Text info */}
                  <div className="flex-1 space-y-1 min-w-0">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">
                      {course.category || 'Umum'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-sm font-bold text-gray-400 dark:text-slate-500 pt-1">
                      {totalLessons} materi · {course.profiles?.full_name || 'Anonymous'}
                    </p>

                    {/* Progress bar + label */}
                    <div className="pt-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isFinished ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {isFinished ? 'Selesai Sempurna ✓' : 'Progres Belajar'}
                        </span>
                        <span className={`text-sm font-black ${isFinished ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {completedCount}/{totalLessons}
                        </span>
                      </div>
                      <div className="relative w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-gray-50 dark:border-slate-700/60">
                        {/* Background track already rendered; fill: */}
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${isFinished ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-blue-600 shadow-lg shadow-blue-500/30'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">
                        {completedCount} dari {totalLessons} materi dikuasai · {progress}%
                      </p>
                    </div>
                  </div>

                  {/* Progress ring + actions */}
                  <div className="flex flex-row lg:flex-col items-center gap-4 flex-shrink-0">
                    {/* Ring with centered % label */}
                    <div className="relative flex-shrink-0">
                      <ProgressRing pct={progress} size={72} finished={isFinished} />
                      <span
                        className={`absolute inset-0 flex items-center justify-center text-sm font-black ${isFinished ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}
                      >
                        {progress}%
                      </span>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-2 w-full min-w-[140px]">
                      <Link href={`/learn/${enroll.course_id}`} className="w-full">
                        <Button
                          as="div"
                          variant={isFinished ? 'outline' : 'primary'}
                          className={`w-full py-3 text-sm font-black rounded-2xl ${!isFinished && 'shadow-lg shadow-blue-500/25'}`}
                          rightIcon={!isFinished ? <ChevronRight size={16} /> : undefined}
                        >
                          {isFinished ? 'Review Materi' : 'Lanjut Belajar'}
                        </Button>
                      </Link>

                      {isFinished && (
                        <Button
                          onClick={() => handleDownloadCert(enroll.course_id, course.title)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-3 text-sm font-black rounded-2xl shadow-lg shadow-emerald-500/25"
                          leftIcon={<Award size={16} />}
                        >
                          Sertifikat
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate preview strip (only for completed) */}
              {isFinished && (
                <div className="border-t border-gray-50 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/30 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-28 flex-shrink-0">
                    <ImageSlot
                      src="/illustrations/certificate-sample.svg"
                      alt="Pratinjau sertifikat"
                      aspectRatio="4/3"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Sertifikat Tersedia
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-300 font-medium">
                      Selamat! Anda telah menyelesaikan <strong>{course.title}</strong>. Unduh sertifikat Anda.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDownloadCert(enroll.course_id, course.title)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 flex-shrink-0"
                    leftIcon={<Download size={14} />}
                  >
                    Unduh PDF
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Upgrade CTA ── */}
      <div className="mt-14 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[3rem] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Wujudkan Potensi Anda</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">Punya Keahlian Untuk Dibagikan?</h2>
            <p className="text-blue-100 font-medium max-w-xl text-sm">
              Daftar sebagai Mentor di SkillSpace dan mulai buat kursus Anda sendiri.
            </p>
          </div>
          <Button
            onClick={handleUpgradeToMentor}
            variant="secondary"
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-5 rounded-[2rem] font-black shadow-2xl transition-all hover:scale-105 active:scale-95"
            rightIcon={<ArrowRight size={20} />}
          >
            Daftar Sebagai Mentor
          </Button>
        </div>
      </div>
    </div>
  )
}
