'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MentorService } from '@/services/mentorService'
import { CourseService } from '@/services/courseService'
import { Profile, Portfolio, Course } from '@/types/database'
import { ShieldCheck, Sparkles, ChevronRight, BookOpen, ExternalLink, X } from 'lucide-react'
import { ImageSlot } from '@/components/ui/ImageSlot'

// ── Initials avatar helper ──────────────────────────────────────
const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-indigo-500 to-indigo-700',
  'from-violet-500 to-violet-700',
  'from-sky-500 to-sky-700',
  'from-teal-500 to-teal-700',
  'from-emerald-500 to-emerald-700',
]
function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join('')
}
function avatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

// ── Course cover helper ─────────────────────────────────────────
function courseCoverSrc(course: Course & { cover_url?: string }) {
  if (course.cover_url) return course.cover_url
  const slug = (course.category ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default'
  return `/illustrations/categories/${slug}.svg`
}

// ── Portfolio lightbox modal ────────────────────────────────────
function PortfolioModal({ item, onClose }: { item: Portfolio; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const lastLinkRef = useRef<HTMLAnchorElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll, restore on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Auto-focus the close button on open
  useEffect(() => { closeButtonRef.current?.focus() }, [])

  // Focus trap: wrap focus between close button and last interactive element
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable || focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onKeyDown={handleKeyDown}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800 max-h-[90vh] flex flex-col">
        {/* Image */}
        <div className="relative aspect-video w-full shrink-0 bg-gray-100 dark:bg-slate-800">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover dark:brightness-95"
              sizes="(min-width: 768px) 672px, 100vw"
              priority
            />
          ) : (
            <ImageSlot
              src="/illustrations/portfolio-default.svg"
              alt={item.title}
              aspectRatio="16/9"
              rounded={false}
            />
          )}
          {/* Close button overlaid on image */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Tutup detail portofolio"
            className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-xl shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-4">
          <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight leading-snug break-words">
            {item.title}
          </h2>
          {item.description && (
            <p className="text-gray-600 dark:text-slate-300 font-medium leading-relaxed text-sm">{item.description}</p>
          )}
          {item.url && (
            <a
              ref={lastLinkRef}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:gap-3 transition-all focus-visible:outline-none focus-visible:underline"
            >
              Lihat Project <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────
export default function MentorPublicProfile() {
  const { id } = useParams()
  const mentorId = id as string
  const [profile, setProfile] = useState<Profile | null>(null)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [courses, setCourses] = useState<(Course & { cover_url?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, portfolioData, courseData] = await Promise.all([
          MentorService.getMentorProfile(mentorId),
          MentorService.getMentorPortfolios(mentorId),
          CourseService.getCoursesByMentorId(mentorId),
        ])
        setProfile(profileData)
        setPortfolios(portfolioData)
        setCourses(courseData as any)
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
      <p className="font-bold text-gray-500 dark:text-slate-400 animate-pulse uppercase tracking-widest text-xs">Memuat Profil Mentor...</p>
    </div>
  )

  if (!profile) return (
    <div className="max-w-4xl mx-auto p-12 text-center">
      <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100">Mentor tidak ditemukan</h2>
      <button onClick={() => router.back()} className="mt-4 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-sm">Kembali</button>
    </div>
  )

  const initials = getInitials(profile.full_name)
  const gradient = avatarGradient(profile.full_name)
  const categories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-10 md:py-12 animate-in fade-in duration-500">

      {/* ── Back button ── */}
      <button
        onClick={() => router.back()}
        className="group flex items-center text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold mb-8 transition-all duration-300 text-sm uppercase tracking-widest"
      >
        <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg mr-3 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <ArrowLeft size={16} />
        </div>
        Kembali
      </button>

      {/* ── Profile hero card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden mb-10">
        {/* Cover banner */}
        <div className="relative h-44 overflow-hidden">
          <ImageSlot
            src="/illustrations/profile-cover.svg"
            alt="Profile cover"
            aspectRatio="6/2"
            rounded={false}
            priority
          />
        </div>

        {/* Avatar + info */}
        <div className="px-8 md:px-12 pb-10">
          <div className="relative -mt-16 flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <div className="w-32 h-32 rounded-[1.75rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover dark:brightness-95"
                  />
                </div>
              ) : (
                <div className={`w-32 h-32 rounded-[1.75rem] bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white dark:border-slate-800 select-none`}>
                  {initials}
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 text-center md:text-left pb-2">
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-slate-100 tracking-tight break-words leading-tight mb-2">
                {profile.full_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                <span className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                  Mentor
                </span>
                {profile.is_verified && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={11} /> Terverifikasi
                  </span>
                )}
                {(profile.points ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Sparkles size={11} /> {profile.points} Poin
                  </span>
                )}
              </div>
            </div>

            {/* Stats row (desktop right side) */}
            <div className="hidden md:flex items-center gap-6 bg-gray-50 dark:bg-slate-800/80 px-8 py-4 rounded-2xl border border-gray-100 dark:border-slate-700/60 flex-shrink-0">
              <div className="text-center">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{courses.length}</div>
                <div className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Kursus</div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{portfolios.length}</div>
                <div className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Portofolio</div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-black text-amber-500 dark:text-amber-400">{profile.points ?? 0}</div>
                <div className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Poin</div>
              </div>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="flex md:hidden items-center justify-center gap-6 bg-gray-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/60 mb-6">
            <div className="text-center">
              <div className="text-xl font-black text-blue-600 dark:text-blue-400">{courses.length}</div>
              <div className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Kursus</div>
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
            <div className="text-center">
              <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{portfolios.length}</div>
              <div className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Portofolio</div>
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />
            <div className="text-center">
              <div className="text-xl font-black text-amber-500 dark:text-amber-400">{profile.points ?? 0}</div>
              <div className="text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Poin</div>
            </div>
          </div>

          {/* Bio + category tags */}
          {profile.bio && (
            <p className="text-gray-600 dark:text-slate-300 font-medium leading-relaxed max-w-3xl text-sm mb-5">{profile.bio}</p>
          )}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span key={cat} className="bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* Portfolio (wider column) */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-full" />
            <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Portofolio &amp; Pengalaman</h2>
          </div>

          {portfolios.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {portfolios.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePortfolio(item)}
                  className="group text-left bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-gray-200/20 dark:shadow-none hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-0.5 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  aria-label={`Lihat detail portofolio: ${item.title}`}
                >
                  {/* Cover image */}
                  <div className="relative aspect-video overflow-hidden shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 dark:brightness-95"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        loading="lazy"
                      />
                    ) : (
                      <ImageSlot
                        src="/illustrations/portfolio-default.svg"
                        alt={item.title}
                        aspectRatio="16/9"
                        rounded={false}
                      />
                    )}
                  </div>
                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col space-y-2">
                    <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug break-words line-clamp-2">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 font-medium line-clamp-2 flex-1">{item.description}</p>
                    )}
                    {item.url && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mt-2">
                        Lihat Project <ExternalLink size={11} aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="w-40 mx-auto mb-4">
                <ImageSlot
                  src="/illustrations/portfolio-default.svg"
                  alt="Belum ada portofolio"
                  aspectRatio="4/3"
                />
              </div>
              <p className="text-gray-400 dark:text-slate-400 font-bold text-sm">Belum ada item portofolio yang ditampilkan.</p>
            </div>
          )}
        </div>

        {/* Courses (narrower column) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
            <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Kursus yang Diajar</h2>
          </div>

          <div className="space-y-4">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/learn/${course.id}`}
                className="group block bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-gray-200/20 dark:shadow-none hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
              >
                {/* Course cover thumbnail */}
                <ImageSlot
                  src={courseCoverSrc(course)}
                  alt={course.title}
                  aspectRatio="16/7"
                  rounded={false}
                />
                <div className="p-5">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{course.category}</span>
                  <h4 className="text-base font-black text-gray-900 dark:text-slate-100 mt-0.5 mb-3 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors break-words line-clamp-2">
                    {course.title}
                  </h4>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800">
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Lihat Detail</span>
                    <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}

            {courses.length === 0 && (
              <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-slate-800 shadow-sm">
                <BookOpen className="mx-auto text-gray-300 dark:text-slate-600 mb-3" size={36} />
                <p className="text-gray-400 dark:text-slate-400 font-bold text-sm">Mentor belum memiliki kursus aktif.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Portfolio lightbox ── */}
      {activePortfolio && (
        <PortfolioModal
          item={activePortfolio}
          onClose={() => setActivePortfolio(null)}
        />
      )}
    </div>
  )
}

// ── Minimal ArrowLeft ───────────────────────────────────────────
function ArrowLeft({ size, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}
