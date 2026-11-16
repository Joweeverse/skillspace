'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen,
  Play,
  Eye,
  Sparkles,
  ChevronRight,
  Palette,
  Code2,
  Briefcase,
  Megaphone,
  BarChart3,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CourseCardProps {
  course: {
    id: string
    title: string
    category?: string
    cover_url?: string
    cover_image_url?: string
    profiles?: {
      full_name?: string
      avatar_url?: string
      points?: number
    }
    lessons?: { id: string }[]
  }
  isEnrolled: boolean
  userRole: string | null
  onPreview: (courseId: string) => void
  onEnroll: (courseId: string) => void
}

/** Converts a category string to a URL-safe slug */
function toCategorySlug(category?: string): string {
  if (!category) return 'default'
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface CategoryConfig {
  label: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  gradient: string
  badgeBg: string
  iconColor: string
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  design: {
    label: 'Design',
    icon: Palette,
    gradient: 'from-violet-500/15 via-purple-500/10 to-pink-500/15 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-pink-950/30',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  programming: {
    label: 'Programming',
    icon: Code2,
    gradient: 'from-blue-500/15 via-sky-500/10 to-cyan-500/15 dark:from-blue-950/40 dark:via-sky-950/30 dark:to-cyan-950/30',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  business: {
    label: 'Business',
    icon: Briefcase,
    gradient: 'from-emerald-500/15 via-teal-500/10 to-amber-500/15 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-amber-950/30',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  marketing: {
    label: 'Marketing',
    icon: Megaphone,
    gradient: 'from-rose-500/15 via-pink-500/10 to-orange-500/15 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-orange-950/30',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  'data-science': {
    label: 'Data Science',
    icon: BarChart3,
    gradient: 'from-teal-500/15 via-indigo-500/10 to-sky-500/15 dark:from-teal-950/40 dark:via-indigo-950/30 dark:to-sky-950/30',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
}

const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  label: 'General',
  icon: Layers,
  gradient: 'from-blue-500/15 via-indigo-500/10 to-slate-500/15 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900',
  badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
  iconColor: 'text-blue-600 dark:text-blue-400',
}

function getCategoryConfig(category?: string): CategoryConfig {
  const slug = toCategorySlug(category)
  return CATEGORY_MAP[slug] ?? {
    ...DEFAULT_CATEGORY_CONFIG,
    label: category || DEFAULT_CATEGORY_CONFIG.label,
  }
}

/** Designed fallback when no cover image or illustration is available */
function DesignedCategoryFallback({ category }: { category?: string }) {
  const config = getCategoryConfig(category)
  const Icon = config.icon

  return (
    <div
      className={`relative flex size-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${config.gradient} bg-slate-50/80 dark:bg-slate-900/60 transition-transform duration-500 group-hover:scale-105`}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/40 dark:bg-white/5 blur-xl" />
      <div className="pointer-events-none absolute -left-6 -bottom-6 size-24 rounded-full bg-white/30 dark:bg-white/5 blur-xl" />

      <div className="relative flex size-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-sm border border-white/60 dark:border-slate-700/60 backdrop-blur-sm">
        <Icon className={`size-6 ${config.iconColor}`} />
      </div>

      <span className={`mt-2 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase shadow-2xs ${config.badgeBg}`}>
        {config.label}
      </span>
    </div>
  )
}

export function CourseCard({ course, isEnrolled, userRole, onPreview, onEnroll }: CourseCardProps) {
  const [imageError, setImageError] = useState(false)
  const lessonCount = course.lessons?.length ?? 0
  const mentorName = course.profiles?.full_name ?? 'Mentor'
  const mentorPoints = course.profiles?.points ?? 0
  const mentorAvatar = course.profiles?.avatar_url
  const category = course.category
  const config = getCategoryConfig(category)

  const mentorInitials = mentorName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'M'

  const uploadedCover = course.cover_url || course.cover_image_url
  const slug = toCategorySlug(category)
  const knownCategories = ['business', 'data-science', 'default', 'design', 'marketing', 'programming']
  const illustrationSrc = !uploadedCover && knownCategories.includes(slug)
    ? `/illustrations/categories/${slug}.svg`
    : null

  const activeImageSrc = uploadedCover || illustrationSrc
  const shouldShowFallback = imageError || !activeImageSrc

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-black/40 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-950">

      {/* ─── Cover Area (16:9 ratio) ─────────────────────────── */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
        {shouldShowFallback ? (
          <DesignedCategoryFallback category={category} />
        ) : (
          <Image
            src={activeImageSrc!}
            alt={`Cover image for ${course.title}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105 dark:brightness-95"
            onError={() => setImageError(true)}
          />
        )}

        {/* Enrolled badge */}
        {isEnrolled && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
            <Play className="size-3 fill-white" aria-hidden="true" />
            Enrolled
          </div>
        )}

        {/* Preview eye button in corner */}
        {!isEnrolled && (
          <div className="absolute right-3 top-3 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPreview(course.id)
              }}
              aria-label={`Preview curriculum for ${course.title}`}
              title="Preview curriculum"
              className="group/btn relative flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm border border-gray-200/70 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-blue-600 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Eye className="size-4" aria-hidden="true" />
              <span className="pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow group-hover/btn:block dark:bg-slate-100 dark:text-slate-900">
                Preview
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ─── Card Body ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">

        {/* Category label */}
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
          {config.label}
        </p>

        {/* Course title (max 2 lines) */}
        <h3 className="mt-1.5 line-clamp-2 min-h-[3rem] text-lg font-bold leading-snug tracking-tight text-gray-950 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>

        {/* Mentor row */}
        <div className="mt-3 flex items-center gap-2">
          {mentorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mentorAvatar}
              alt=""
              className="size-6 rounded-full object-cover dark:brightness-95 ring-1 ring-gray-200/80 dark:ring-slate-700"
              aria-hidden="true"
            />
          ) : (
            <span
              className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold ring-1 ring-blue-200 dark:ring-blue-900"
              aria-hidden="true"
            >
              {mentorInitials}
            </span>
          )}
          <span className="truncate text-xs font-medium text-gray-600 dark:text-slate-400">
            {mentorName}
          </span>
        </div>

        {/* Meta row: lesson count + yellow mentor points badge */}
        <div className="mt-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <BookOpen className="size-3.5" aria-hidden="true" />
            <span>{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
          </div>

          {/* Yellow mentor-points badge */}
          <div
            className="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800"
            aria-label={`${mentorPoints} mentor points`}
          >
            <Sparkles className="size-3 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            {mentorPoints} pts
          </div>
        </div>

        {/* ─── Bottom CTA (full-width primary button) ────────── */}
        <div className="mt-auto pt-5 border-t border-gray-100 dark:border-slate-800">
          {isEnrolled && userRole === 'student' ? (
            <Link
              href={`/learn/${course.id}`}
              className="block w-full focus-visible:outline-none"
              tabIndex={-1}
            >
              <Button
                as="div"
                variant="primary"
                size="sm"
                className="w-full"
                rightIcon={<Play className="size-3.5 fill-current" aria-hidden="true" />}
              >
                Continue Learning
              </Button>
            </Link>
          ) : userRole === 'mentor' ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onPreview(course.id)}
              rightIcon={<BookOpen className="size-3.5" aria-hidden="true" />}
            >
              View Curriculum
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() => onEnroll(course.id)}
              rightIcon={<ChevronRight className="size-4" aria-hidden="true" />}
            >
              Enroll Now
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
