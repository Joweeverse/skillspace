'use client'

import React, { useEffect, useState } from 'react'
import { CourseService } from '@/services/courseService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import Link from 'next/link'
import jsPDF from 'jspdf'
import { useRouter } from 'next/navigation'

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
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
        const data = await CourseService.getUserEnrollments(session.user.id)
        setEnrollments(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [router])

  const generateCertificate = (courseTitle: string, studentName: string) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Desain Sertifikat Sederhana
    doc.rect(10, 10, 277, 190, 'S')
    doc.setFontSize(40)
    doc.text('SERTIFIKAT KELULUSAN', 148, 60, { align: 'center' })
    
    doc.setFontSize(20)
    doc.text('Diberikan kepada:', 148, 90, { align: 'center' })
    
    doc.setFontSize(30)
    doc.setTextColor(37, 99, 235) // Blue-600
    doc.text(studentName.toUpperCase(), 148, 110, { align: 'center' })
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(`Atas keberhasilannya menyelesaikan kursus:`, 148, 130, { align: 'center' })
    
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text(courseTitle, 148, 150, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Tanggal: ${new Date().toLocaleDateString()}`, 148, 180, { align: 'center' })
    doc.text(`SkillSpace Learning Platform`, 148, 187, { align: 'center' })

    doc.save(`Sertifikat_${courseTitle.replace(/\s+/g, '_')}.pdf`)
  }

  if (loading) return <div className="p-8 text-center">Memuat dashboard...</div>

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Belajar Saya</h1>
        <div className="text-sm text-gray-500">{enrollments.length} Kursus diikuti</div>
      </div>
      
      <div className="grid gap-6">
        {enrollments.map((enroll) => {
          const course = enroll.courses
          if (!course) return null

          // Using dynamic lesson count from database
          const lessons = course.lessons || []
          const totalLessons = lessons.length
          const completedCount = enroll.completed_lessons?.length || 0
          
          // Avoid division by zero
          const progress = totalLessons > 0 
            ? Math.min(Math.round((completedCount / totalLessons) * 100), 100) 
            : 0
            
          const isFinished = totalLessons > 0 && completedCount >= totalLessons

          return (
            <div key={enroll.course_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">{course.category || 'Umum'}</span>
                <h3 className="text-xl font-bold mt-1 text-gray-900">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-4">Mentor: {course.profiles?.full_name || 'Anonymous'}</p>
                
                <div className="w-full bg-gray-100 rounded-full h-2.5 max-w-md overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-xs font-bold text-blue-700">{progress}% Selesai</span>
                   <span className="text-xs text-gray-400">({completedCount}/{totalLessons} Materi)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/learn/${enroll.course_id}`}>
                  <Button variant="secondary" className="w-full sm:w-auto font-medium">
                    {isFinished ? 'Review Materi' : 'Lanjut Belajar'}
                  </Button>
                </Link>
                {isFinished && (
                  <Button 
                    onClick={() => generateCertificate(course.title, user?.user_metadata?.full_name || 'Siswa')} 
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto font-medium shadow-sm shadow-green-100"
                  >
                    Unduh Sertifikat
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {enrollments.length === 0 && (
          <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
               <BookOpen className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Belum ada aktivitas belajar</h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">Anda belum mendaftar di kursus apa pun. Ayo mulai belajar hal baru hari ini!</p>
            <Link href="/courses">
              <Button className="px-8">Jelajahi Katalog Kursus</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple BookOpen icon placeholder
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
