'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'

export default function Home() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkRole() {
      try {
        const profile = await AuthService.getCurrentUserProfile()
        if (profile) {
          setUserRole(profile.role)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    checkRole()
  }, [])

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Empower Your Future with SkillSpace
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Learn from industry experts, master new skills, and advance your career with our comprehensive e-learning platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {!loading && userRole === 'mentor' ? (
              <Link href="/dashboard/mentor">
                <Button className="px-8 py-3 text-lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <Link href="/courses">
                <Button className="px-8 py-3 text-lg">Explore Courses</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Learn Faster</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to master your craft
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147L12 15l7.74-4.853a4.5 4.5 0 00-4.89-7.37L12 3.75l-2.85-1.103a4.5 4.5 0 00-4.89 7.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18l-7.74-4.853A4.5 4.5 0 0112 15h0a4.5 4.5 0 017.74-1.853L12 18z" />
                    </svg>
                  </div>
                  Expert Mentors
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Learn from verified professionals with years of experience in their respective fields.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  Structured Learning
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Curated curricula designed to take you from beginner to advanced in a logical sequence.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
