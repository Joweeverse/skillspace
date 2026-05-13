'use client'

import React, { useEffect, useState } from 'react'
import { CourseService } from '@/services/courseService'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await CourseService.getAvailableCourses()
        setCourses(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  const handleEnroll = async (courseId: string) => {
    try {
      // Hardcoded student_id untuk demo
      const studentId = '11111111-1111-1111-1111-111111111111'
      await CourseService.enrollCourse(studentId, courseId)
      alert('Berhasil mendaftar! Anda sekarang bisa mulai belajar.')
    } catch (err) {
      console.error(err)
      alert('Gagal mendaftar atau Anda sudah terdaftar.')
    }
  }

  if (loading) return <div className="p-8 text-center">Memuat kursus...</div>

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Katalog Kursus SkillSpace</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="h-40 bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
              {course.title.charAt(0)}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{course.category}</span>
              <h3 className="text-xl font-bold mt-2 mb-1">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4">Mentor: {course.profiles?.full_name || 'Anonymous'}</p>
              
              <div className="mt-auto space-y-2">
                <Button onClick={() => handleEnroll(course.id)} className="w-full">
                  Daftar Sekarang
                </Button>
                <Link href={`/learn/${course.id}`} className="block">
                  <Button variant="secondary" className="w-full">
                    Masuk Kelas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
