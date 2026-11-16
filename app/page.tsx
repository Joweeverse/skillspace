'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { AuthService } from '@/services/authService'
import { CourseService } from '@/services/courseService'
import { MentorService } from '@/services/mentorService'

const steps = [
  {
    image: '/illustrations/step-choose.svg',
    title: 'Choose your path',
    description: 'Find a course that fits the skill you want to build next.',
    alt: 'Student choosing a learning path with a mentor nearby',
    number: '01',
  },
  {
    image: '/illustrations/step-learn.svg',
    title: 'Learn with guidance',
    description: 'Follow focused lessons and get support from experienced mentors.',
    alt: 'Mentor helping a student learn from course materials',
    number: '02',
  },
  {
    image: '/illustrations/step-track.svg',
    title: 'See your progress',
    description: 'Keep your learning momentum with progress that is easy to follow.',
    alt: 'Student tracking learning progress and completed milestones',
    number: '03',
  },
]

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [courseCount, setCourseCount] = useState<number | null>(null)
  const [mentorCount, setMentorCount] = useState<number | null>(null)

  useEffect(() => {
    async function loadHomeData() {
      const [profileResult, coursesResult, mentorsResult] = await Promise.allSettled([
        AuthService.getCurrentUserProfile(),
        CourseService.getAvailableCourses(),
        MentorService.getAllMentors(),
      ])

      if (profileResult.status === 'fulfilled' && profileResult.value) {
        setUserRole(profileResult.value.role)
      } else if (profileResult.status === 'rejected') {
        console.error('Error fetching profile:', profileResult.reason)
      }

      if (coursesResult.status === 'fulfilled') {
        setCourseCount(coursesResult.value.length)
      } else {
        console.error('Error fetching courses:', coursesResult.reason)
      }

      if (mentorsResult.status === 'fulfilled') {
        setMentorCount(mentorsResult.value.length)
      } else {
        console.error('Error fetching mentors:', mentorsResult.reason)
      }

      setLoading(false)
    }

    loadHomeData()
  }, [])

  const primaryAction = !loading && userRole === 'mentor'
    ? { href: '/dashboard/mentor', label: 'Go to Dashboard' }
    : { href: '/courses', label: 'Explore Courses' }

  return (
    <div className="overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-200">

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative py-14 sm:py-20 lg:py-28">
        {/* Blue gradient wash behind hero */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[80%] bg-gradient-to-br from-blue-50 via-blue-50/60 to-white dark:from-slate-900/80 dark:via-slate-900/50 dark:to-slate-950" aria-hidden="true" />
        {/* Decorative circle blobs */}
        <div className="pointer-events-none absolute -right-24 -top-16 -z-0 size-72 rounded-full bg-blue-100/60 dark:bg-blue-900/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-16 top-40 -z-0 size-56 rounded-full bg-blue-200/30 dark:bg-indigo-900/20 blur-3xl" aria-hidden="true" />

        <Container className="relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            {/* Text block */}
            <div className="order-2 lg:order-1">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                Learning made connected
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-950 dark:text-slate-100 sm:text-6xl lg:text-7xl lg:leading-[1.04]">
                Empower Your Future with{' '}
                <span className="text-blue-600 dark:text-blue-400">SkillSpace</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-gray-600 dark:text-slate-400 sm:text-lg sm:leading-8">
                Learn from industry experts, master new skills, and advance your career with our comprehensive e-learning platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={primaryAction.href}
                  className="inline-flex rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                >
                  <Button
                    as="span"
                    size="lg"
                    rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}
                    className="shadow-lg shadow-blue-500/30"
                  >
                    {primaryAction.label}
                  </Button>
                </Link>
                <Link
                  href="/mentors"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Meet our mentors
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div className="order-1 lg:order-2">
              <ImageSlot
                src="/illustrations/hero.svg"
                alt="A mentor and student looking toward the course exploration action"
                aspectRatio="16 / 10"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ─── THE PROBLEM ───────────────────────────────────────────────── */}
      <section className="border-y border-blue-100 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-900/50 py-16 sm:py-24 transition-colors duration-200">
        <Container size="content">
          {/* Section label */}
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">The problem</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-slate-100 sm:text-4xl">
              Stop piecing learning together.
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600 dark:text-slate-400">
              Most learners juggle three or four different tools just to finish one course.
            </p>
          </div>

          {/* Before / After cards */}
          <div className="mt-10 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-10">
            {/* Before */}
            <article className="rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-7">
              <ImageSlot
                src="/illustrations/problem-scattered.svg"
                alt="Video, quiz, and chat tools scattered across separate platforms"
                aspectRatio="4 / 3"
              />
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-950/60 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-300">
                <span aria-hidden="true">✗</span> Before SkillSpace
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-400">
                Videos, quizzes, and conversations are spread across separate places — context switching kills momentum.
              </p>
            </article>

            {/* Arrow separator */}
            <div className="flex items-center justify-center">
              <div className="hidden size-12 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-500/30 md:flex">
                <ArrowRight className="size-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex md:hidden">
                <div className="size-10 flex items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-500/30">
                  <ArrowRight className="size-5 rotate-90 text-white" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* After */}
            <article className="rounded-3xl border-2 border-blue-500 dark:border-blue-500/80 bg-white dark:bg-slate-900 p-5 shadow-[0_16px_40px_rgb(37_99_235_/_0.14)] dark:shadow-none sm:p-7">
              <ImageSlot
                src="/illustrations/solution-unified.svg"
                alt="A unified SkillSpace workspace with learning, quizzes, and discussion together"
                aspectRatio="4 / 3"
              />
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                <span aria-hidden="true">✓</span> With SkillSpace
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-400">
                One connected space keeps learning, practice, and support in sync — from start to finish.
              </p>
            </article>
          </div>
        </Container>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-slate-100 sm:text-4xl">
              A clearer way to keep growing
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600 dark:text-slate-400">
              Three simple steps are all it takes to go from curious to confident.
            </p>
          </div>

          <div className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {/* Connecting line — desktop only */}
            <div
              className="absolute left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] top-[7.5rem] hidden h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 dark:from-slate-800 dark:via-blue-600 dark:to-slate-800 md:block"
              aria-hidden="true"
            />

            {steps.map((step) => (
              <article key={step.title} className="relative z-10 text-center">
                {/* Image card */}
                <div className="mx-auto max-w-xs overflow-hidden rounded-3xl bg-blue-50 dark:bg-slate-900 shadow-md">
                  <ImageSlot
                    src={step.image}
                    alt={step.alt}
                    aspectRatio="4 / 3"
                  />
                </div>

                {/* Step number badge */}
                <div className="mx-auto -mt-5 flex size-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/40 ring-4 ring-white dark:ring-slate-950">
                  {step.number}
                </div>

                <h3 className="mt-4 text-xl font-bold text-gray-950 dark:text-slate-100">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-600 dark:text-slate-400">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── KEY NUMBERS ───────────────────────────────────────────────── */}
      <section className="bg-blue-700 dark:bg-blue-900 py-14 text-white sm:py-20 transition-colors duration-200">
        <Container size="content">
          <div className="grid gap-10 text-center sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-blue-500 dark:sm:divide-blue-700">
            <div className="sm:px-10">
              <p
                className="text-5xl font-extrabold tabular-nums tracking-tight sm:text-6xl"
                aria-label={`${courseCount ?? 0} courses`}
              >
                {courseCount ?? '—'}
              </p>
              <p className="mt-3 text-base font-medium text-blue-200 dark:text-blue-300">Courses to explore</p>
              <p className="mt-1 text-xs text-blue-300 dark:text-blue-400">Across design, development, AI, and more</p>
            </div>
            <div className="sm:px-10">
              <p
                className="text-5xl font-extrabold tabular-nums tracking-tight sm:text-6xl"
                aria-label={`${mentorCount ?? 0} mentors`}
              >
                {mentorCount ?? '—'}
              </p>
              <p className="mt-3 text-base font-medium text-blue-200 dark:text-blue-300">Mentors sharing expertise</p>
              <p className="mt-1 text-xs text-blue-300 dark:text-blue-400">Real practitioners, not just instructors</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── BECOME A MENTOR ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <Container size="content">
          <div className="grid items-center gap-0 overflow-hidden rounded-3xl bg-gray-950 dark:bg-slate-900 border dark:border-slate-800 md:grid-cols-2">
            {/* Image side */}
            <div className="bg-gray-900 dark:bg-slate-950">
              <ImageSlot
                src="/illustrations/become-mentor.svg"
                alt="Mentor preparing to share knowledge with students on SkillSpace"
                aspectRatio="4 / 3"
                rounded={false}
              />
            </div>

            {/* Text side */}
            <div className="p-8 text-white sm:p-10 lg:p-14">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-300">
                Share what you know
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Help learners<br />move forward.
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-300">
                Create a meaningful learning space, guide students through your expertise, and watch their confidence grow.
              </p>

              {/* Benefit list */}
              <ul className="mt-6 space-y-2 text-sm text-gray-400">
                {[
                  'Publish structured courses at your own pace',
                  'Engage students with quizzes and live discussions',
                  'Track learner progress from one dashboard',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-blue-400" aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="mt-8 inline-flex rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <Button
                  as="span"
                  size="lg"
                  variant="secondary"
                  rightIcon={<ArrowRight className="size-5" aria-hidden="true" />}
                >
                  Become a Mentor
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}
