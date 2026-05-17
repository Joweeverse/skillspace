'use client'

import React, { useEffect, useState } from 'react'
import { CourseService } from '@/services/courseService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([])
  const [userEnrollments, setUserEnrollments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const session = await AuthService.getSession()
        if (session?.user) {
          const profile = await AuthService.getUserProfile(session.user.id)
          setUserRole(profile.role)

          if (profile.role === 'mentor') {
            alert('Mentor tidak dapat mengambil kursus. Silakan gunakan akun Siswa.')
            router.push('/dashboard/mentor')
            return
          }

          setStudentId(session.user.id)
          const enrollments = await CourseService.getUserEnrollments(session.user.id)
          setUserEnrollments(enrollments.map(e => e.course_id))
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

  const handleEnroll = async (courseId: string) => {
    if (!studentId) {
      router.push('/login')
      return
    }

    if (userRole === 'mentor') {
      alert('Mentor tidak dapat mendaftar kursus.')
      return
    }

    if (userEnrollments.includes(courseId)) {
      router.push(`/learn/${courseId}`)
      return
    }
    
    try {
      await CourseService.enrollCourse(studentId, courseId)
      alert('Berhasil mendaftar! Anda sekarang bisa mulai belajar.')
      setUserEnrollments([...userEnrollments, courseId])
      router.push(`/learn/${courseId}`)
    } catch (err) {
      console.error(err)
      alert('Gagal mendaftar atau Anda sudah terdaftar.')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat katalog kursus...</div>
  if (userRole === 'mentor') return null

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Katalog Kursus SkillSpace</h1>
        <div className="text-sm text-gray-500">{courses.length} Kursus tersedia</div>
      </div>
      
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = userEnrollments.includes(course.id)
            
            return (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-40 bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                  {course.title?.charAt(0) || 'K'}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{course.category || 'Umum'}</span>
                  <h3 className="text-xl font-bold mt-2 mb-1 text-gray-900">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">Mentor: {course.profiles?.full_name || 'Anonymous'}</p>
                  
                  <div className="mt-auto">
                    {isEnrolled ? (
                      <Link href={`/learn/${course.id}`} className="block">
                        <Button variant="secondary" className="w-full bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">
                          Masuk Kelas
                        </Button>
                      </Link>
                    ) : (
                      <Button onClick={() => handleEnroll(course.id)} className="w-full bg-blue-600 hover:bg-blue-700">
                        Daftar Kelas
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-gray-400" size={32} />
           </div>
           <h3 className="text-lg font-bold text-gray-900">Belum ada kursus tersedia</h3>
           <p className="text-gray-500 mt-1 max-w-xs mx-auto">Silakan kembali lagi nanti atau hubungi administrator untuk info lebih lanjut.</p>
        </div>
      )}
    </div>
  )
}

// Simple BookOpen icon placeholder since we don't have Lucide everywhere
const BookOpen = ({ className, size }: { className?: string, size?: number }) => (
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
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
)
