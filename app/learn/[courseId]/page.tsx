'use client'

import React, { useEffect, useState, use } from 'react'
import { CourseService } from '@/services/courseService'
import { Lesson } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { DiscussionSection } from '@/components/features/DiscussionSection'
import { QuizModal } from '@/components/features/QuizModal'

export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)

  useEffect(() => {
    async function loadContent() {
      try {
        const [courseData, lessonData] = await Promise.all([
          CourseService.getCourseById(courseId),
          CourseService.getLessonsByCourseId(courseId)
        ])
        setCourse(courseData)
        setLessons(lessonData)
        if (lessonData.length > 0) {
          setCurrentLesson(lessonData[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadContent()
  }, [courseId])

  // Helper untuk mengekstrak ID Video YouTube
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  if (loading) return <div className="p-8 text-center">Menyiapkan materi belajar...</div>
  if (!course) return <div className="p-8 text-center text-red-500">Kursus tidak ditemukan.</div>

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Sidebar Daftar Pelajaran */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
          <p className="text-sm text-gray-500 mt-1">Mentor: {course.profiles?.full_name}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => setCurrentLesson(lesson)}
              className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                currentLesson?.id === lesson.id 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="font-semibold">Materi {index + 1}</div>
              <div className="truncate">{lesson.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Konten Utama (Video & Materi) */}
      <div className="flex-1 overflow-y-auto">
        {currentLesson ? (
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
            
            {/* Video & PDF Grid */}
            <div className={`grid gap-6 ${currentLesson.pdf_url ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Video Player */}
              {currentLesson.youtube_url && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${getYoutubeId(currentLesson.youtube_url)}`}
                    title={currentLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {/* PDF Viewer */}
              {currentLesson.pdf_url && (
                <div className="aspect-video lg:aspect-auto bg-gray-200 rounded-xl overflow-hidden shadow-lg border border-gray-300">
                  <iframe
                    src={`${currentLesson.pdf_url}#toolbar=0`}
                    width="100%"
                    height="100%"
                    className="min-h-[400px]"
                    title="Materi PDF"
                  ></iframe>
                </div>
              )}
            </div>

            {/* Konten Teks */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 prose max-w-none">
              <h3 className="text-lg font-semibold mb-3">Deskripsi Materi</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{currentLesson.content}</p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-between items-center bg-blue-600 p-6 rounded-xl text-white shadow-md">
              <div>
                <h4 className="font-bold text-lg">Siap untuk Menguji Pemahaman?</h4>
                <p className="text-blue-100 text-sm">Ambil kuis untuk materi ini sekarang.</p>
              </div>
              <Button variant="secondary" onClick={() => setShowQuiz(true)}>
                Ambil Kuis Sekarang
              </Button>
            </div>

            {/* Bagian Diskusi */}
            <DiscussionSection 
              lessonId={currentLesson.id} 
              userId="11111111-1111-1111-1111-111111111111" // Demo Student ID
            />

            {showQuiz && (
              <QuizModal 
                lessonId={currentLesson.id} 
                onClose={() => setShowQuiz(false)} 
                onComplete={() => alert('Bagus! Anda telah menyelesaikan kuis.')}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Pilih materi dari sidebar untuk mulai belajar.
          </div>
        )}
      </div>
    </div>
  )
}
