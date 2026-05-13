'use client'

import React, { useEffect, useState } from 'react'
import { CourseService } from '@/services/courseService'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import jsPDF from 'jspdf'

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const studentId = '11111111-1111-1111-1111-111111111111' // Demo ID

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await CourseService.getUserEnrollments(studentId)
        setEnrollments(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

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
      <h1 className="text-3xl font-bold mb-8">Dashboard Belajar Saya</h1>
      
      <div className="grid gap-6">
        {enrollments.map((enroll) => {
          const totalLessons = 5 // Idealnya ini dihitung dinamis dari API
          const completedCount = enroll.completed_lessons?.length || 0
          const progress = Math.min(Math.round((completedCount / totalLessons) * 100), 100)
          const isFinished = progress === 100

          return (
            <div key={enroll.course_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <span className="text-xs font-semibold text-blue-600 uppercase">{enroll.courses.category}</span>
                <h3 className="text-xl font-bold mt-1">{enroll.courses.title}</h3>
                <p className="text-sm text-gray-500 mb-4">Mentor: {enroll.courses.profiles?.full_name}</p>
                
                <div className="w-full bg-gray-100 rounded-full h-2.5 max-w-md">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2 font-medium">
                  Progress: {progress}% ({completedCount}/{totalLessons} Materi)
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/learn/${enroll.course_id}`}>
                  <Button variant="secondary" className="w-full sm:w-auto">
                    {isFinished ? 'Review Materi' : 'Lanjut Belajar'}
                  </Button>
                </Link>
                {isFinished && (
                  <Button onClick={() => generateCertificate(enroll.courses.title, 'Nama Siswa')} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                    Unduh Sertifikat
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {enrollments.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">Anda belum mendaftar di kursus apa pun.</p>
            <Link href="/courses">
              <Button>Cari Kursus Sekarang</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
