'use client'

import Link from 'next/link'
import { BookOpen, Play, Eye, Sparkles, User, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'

interface CourseCardProps {
  course: {
    id: string
    title: string
    category?: string
    cover_url?: string
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

/** Converts a category string to a URL-safe slug for the illustration path */
function categorySlug(category?: string) {
  if (!category) return 'default'
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Map slug → human label for display */
const CATEGORY_LABELS: Record<string, string> = {
  design:        'Design',
  programming:   'Programming',
  business:      'Business',
  marketing:     'Marketing',
  'data-science': 'Data Science',
}

function categoryLabel(category?: string) {
  if (!category) return 'General'
  const slug = categorySlug(category)
  return CATEGORY_LABELS[slug] ?? category
}

/** Chooses the cover image: uploaded cover > category SVG > default */
function coverSrc(course: CourseCardProps['course']) {
  if (course.cover_url) return course.cover_url
  const slug = categorySlug(course.category)
  return `/illustrations/categories/${slug}.svg`
}

export function CourseCard({ course, isEnrolled, userRole, onPreview, onEnroll }: CourseCardProps) {
  const lessonCount = course.lessons?.length ?? 0
  const mentorName = course.profiles?.full_name ?? 'Mentor'
  const mentorPoints = course.profiles?.points ?? 0
  const mentorAvatar = course.profiles?.avatar_url

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-950">

      {/* Cover image */}
      <div className="relative">
        <ImageSlot
          src={coverSrc(course)}
          alt={`Cover image for ${course.title}`}
          aspectRatio="4 / 3"
          rounded={false}
        />

        {/* Enrolled badge */}
        {isEnrolled && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow">
            <Play className="size-3 fill-white" aria-hidden="true" />
            Enrolled
          </div>
        )}

        {/* Preview eye button — always visible for non-enrolled */}
        {!isEnrolled && (
          <button
            onClick={() => onPreview(course.id)}
            aria-label={`Preview ${course.title}`}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-gray-600 dark:bg-slate-800/90 dark:text-slate-300 shadow backdrop-blur-sm transition hover:bg-white hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Eye className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">

        {/* Category label */}
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
          {categoryLabel(course.category)}
        </p>

        {/* Title */}
        <h3 className="mt-1.5 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-gray-950 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>

        {/* Mentor row */}
        <div className="mt-3 flex items-center gap-2">
          {mentorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mentorAvatar}
              alt=""
              className="size-6 rounded-full object-cover dark:brightness-95"
              aria-hidden="true"
            />
          ) : (
            <span
              className="flex size-6 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950/80 dark:text-blue-400"
              aria-hidden="true"
            >
              <User className="size-3.5" />
            </span>
          )}
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{mentorName}</span>
        </div>

        {/* Meta row: lesson count + points badge */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-400">
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

        {/* CTA button — pushed to bottom */}
        <div className="mt-5 border-t border-gray-100 dark:border-slate-800 pt-4">
          {isEnrolled && userRole === 'student' ? (
            <Link
              href={`/learn/${course.id}`}
              className="block focus-visible:outline-none"
              tabIndex={-1}
            >
              <Button
                as="div"
                variant="secondary"
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
