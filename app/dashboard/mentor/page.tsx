'use client'

import React, { useState, useEffect } from 'react'
import { CourseService } from '@/services/courseService'
import { QuizService, ManualQuizInput } from '@/services/quizService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import { useRouter } from 'next/navigation'
import { Course, Lesson } from '@/types/database'
import { Plus, Edit, BookOpen, HelpCircle, X, ChevronRight, Trash2, Eye, MessageSquare } from 'lucide-react'
import { DiscussionSection } from '@/components/features/DiscussionSection'

export default function MentorDashboard() {
  const [mentorId, setMentorId] = useState<string | null>(null)
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([])
  
  // Modal States
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [showDiscussionModal, setShowDiscussionModal] = useState(false)
  
  // Edit States
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<{id: string, title: string} | null>(null)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)

  const router = useRouter()

  // Form States
  const [newCourse, setNewCourse] = useState({ title: '', category: '' })
  const [materialForm, setMaterialForm] = useState({ title: '', content: '', youtube_url: '', pdf_url: '' })
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<ManualQuizInput['questions']>([
    { question_text: '', options_json: ['', '', '', ''], correct_answer: '' }
  ])

  useEffect(() => {
    async function loadInitialData() {
      const session = await AuthService.getSession()
      if (session?.user) {
        setMentorId(session.user.id)
        await refreshCourses(session.user.id)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }
    loadInitialData()
  }, [router])

  const refreshCourses = async (id: string) => {
    try {
      const courses = await CourseService.getCoursesByMentorId(id)
      setMyCourses(courses)
    } catch (err) {
      console.error('Error loading courses:', err)
    }
  }

  const handleCourseClick = async (course: Course) => {
    setSelectedCourse(course)
    await refreshLessons(course.id)
  }

  const refreshLessons = async (courseId: string) => {
    try {
      const lessons = await CourseService.getLessonsByCourseId(courseId)
      setCourseLessons(lessons)
    } catch (err) {
      console.error('Error loading lessons:', err)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mentorId) return
    try {
      const res = await CourseService.createCourse({ ...newCourse, mentor_id: mentorId })
      setMyCourses([...myCourses, res])
      setShowAddCourseModal(false)
      setNewCourse({ title: '', category: '' })
      alert('Kursus berhasil dibuat!')
    } catch (err: any) {
      alert(`Gagal: ${err.message}`)
    }
  }

  const handleDeleteCourse = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation() // Mencegah masuk ke dalam kursus
    if (!confirm('Hapus kursus ini beserta seluruh materi di dalamnya?')) return
    try {
      await CourseService.deleteCourse(courseId)
      setMyCourses(myCourses.filter(c => c.id !== courseId))
      alert('Kursus berhasil dihapus')
    } catch (err: any) {
      alert(`Gagal: ${err.message}`)
    }
  }

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return
    try {
      if (editingLesson) {
        await CourseService.updateLesson(editingLesson.id, materialForm)
        alert('Materi berhasil diperbarui!')
      } else {
        await CourseService.addLesson({ ...materialForm, course_id: selectedCourse.id })
        alert('Materi berhasil ditambahkan!')
      }
      await refreshLessons(selectedCourse.id)
      setShowMaterialModal(false)
      setEditingLesson(null)
      setMaterialForm({ title: '', content: '', youtube_url: '', pdf_url: '' })
    } catch (err: any) {
      alert(`Gagal: ${err.message}`)
    }
  }

  const handleOpenMaterialModal = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson)
      setMaterialForm({
        title: lesson.title,
        content: lesson.content || '',
        youtube_url: lesson.youtube_url || '',
        pdf_url: lesson.pdf_url || ''
      })
    } else {
      setEditingLesson(null)
      setMaterialForm({ title: '', content: '', youtube_url: '', pdf_url: '' })
    }
    setShowMaterialModal(true)
  }

  const handleOpenQuizModal = async (lessonId: string) => {
    setActiveLessonId(lessonId)
    try {
      const existingQuiz = await QuizService.getQuizByLessonId(lessonId)
      if (existingQuiz) {
        setEditingQuiz({ id: existingQuiz.quiz.id, title: existingQuiz.quiz.title })
        setQuizTitle(existingQuiz.quiz.title)
        setQuestions(existingQuiz.questions.map(q => ({
          question_text: q.question_text,
          options_json: q.options_json,
          correct_answer: q.correct_answer
        })))
      } else {
        setEditingQuiz(null)
        setQuizTitle('')
        setQuestions([{ question_text: '', options_json: ['', '', '', ''], correct_answer: '' }])
      }
      setShowQuizModal(true)
    } catch (err) {
      console.error('Error loading quiz:', err)
    }
  }

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLessonId) return
    try {
      if (editingQuiz) {
        await QuizService.updateQuiz(editingQuiz.id, quizTitle, questions)
        alert('Kuis berhasil diperbarui!')
      } else {
        await QuizService.createManualQuiz({
          lesson_id: activeLessonId,
          title: quizTitle,
          questions: questions
        })
        alert('Kuis berhasil dibuat!')
      }
      setShowQuizModal(false)
    } catch (err: any) {
      alert(`Gagal: ${err.message}`)
    }
  }

  const handleOpenDiscussion = (lessonId: string) => {
    setActiveLessonId(lessonId)
    setShowDiscussionModal(true)
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Hapus materi ini?')) return
    try {
      await CourseService.deleteLesson(id)
      if (selectedCourse) await refreshLessons(selectedCourse.id)
    } catch (err: any) {
      alert(`Gagal: ${err.message}`)
    }
  }

  if (loading) return <div className="p-8 text-center">Memuat dashboard...</div>

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
          <p className="text-gray-500">Kelola kursus dan materi belajar Anda.</p>
        </div>
        <Button onClick={() => setShowAddCourseModal(true)} className="flex items-center gap-2">
          <Plus size={20} /> Tambah Kursus
        </Button>
      </div>

      {!selectedCourse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCourses.map((course) => (
            <div 
              key={course.id} 
              onClick={() => handleCourseClick(course)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-500 cursor-pointer transition-all group relative"
            >
              <button 
                onClick={(e) => handleDeleteCourse(e, course.id)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors"
                title="Hapus Kursus"
              >
                <Trash2 size={18} />
              </button>

              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BookOpen size={24} />
              </div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{course.category}</span>
              <h3 className="text-xl font-bold mt-2 text-gray-900">{course.title}</h3>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Edit size={16} className="mr-1" /> Klik untuk kelola materi
              </div>
            </div>
          ))}
          {myCourses.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500">Anda belum membuat kursus apapun.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← Kembali ke Daftar Kursus
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-start mb-8 text-sm">
              <div>
                <span className="font-semibold text-blue-600 uppercase tracking-widest">{selectedCourse.category}</span>
                <h2 className="text-3xl font-bold text-gray-900 mt-1">{selectedCourse.title}</h2>
              </div>
              <Button onClick={() => handleOpenMaterialModal()} variant="secondary" className="flex items-center gap-2">
                <Plus size={18} /> Tambah Materi
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Daftar Materi</h3>
              {courseLessons.map((lesson, idx) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => handleOpenMaterialModal(lesson)}>
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                         {lesson.youtube_url && <span>🎥 Video</span>}
                         {lesson.pdf_url && <span>📄 PDF</span>}
                         <span className="text-blue-600 font-medium ml-2 flex items-center gap-1">
                           <Eye size={12} /> Preview & Edit
                         </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleOpenDiscussion(lesson.id)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight bg-white"
                    >
                      <MessageSquare size={14} /> Diskusi
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleOpenQuizModal(lesson.id)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight bg-white"
                    >
                      <HelpCircle size={14} /> Kuis
                    </Button>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {courseLessons.length === 0 && (
                <p className="text-gray-500 italic text-center py-4">Belum ada materi. Klik "Tambah Materi" untuk mulai.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Buat Kursus Baru</h3>
              <button onClick={() => setShowAddCourseModal(false)}><X /></button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Judul Kursus</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                  required 
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Kategori</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                  required 
                  value={newCourse.category}
                  onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full">Buat Kursus</Button>
            </form>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">{editingLesson ? 'Edit & Preview Materi' : 'Tambah Materi Baru'}</h3>
              <button onClick={() => setShowMaterialModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSaveMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Judul Materi</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                  required 
                  value={materialForm.title}
                  onChange={e => setMaterialForm({...materialForm, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Isi Konten (Teks)</label>
                <textarea 
                  className="w-full border border-gray-300 p-2 rounded-md h-32 focus:ring-2 focus:ring-blue-500 outline-none" 
                  required 
                  value={materialForm.content}
                  onChange={e => setMaterialForm({...materialForm, content: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Link YouTube (Opsional)</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={materialForm.youtube_url}
                    placeholder="https://youtube.com/watch?v=..."
                    onChange={e => setMaterialForm({...materialForm, youtube_url: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Link PDF (Opsional)</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={materialForm.pdf_url}
                    placeholder="https://example.com/file.pdf"
                    onChange={e => setMaterialForm({...materialForm, pdf_url: e.target.value})}
                  />
                </div>
              </div>

              {/* LIVE PREVIEW SECTION */}
              {editingLesson && (
                <div className="mt-8 pt-8 border-t">
                   <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Live Preview</h4>
                   <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                      <h1 className="text-xl font-bold mb-2">{materialForm.title}</h1>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{materialForm.content}</p>
                   </div>
                </div>
              )}

              <Button type="submit" className="w-full py-3">{editingLesson ? 'Simpan Perubahan' : 'Simpan Materi'}</Button>
            </form>
          </div>
        </div>
      )}

      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">{editingQuiz ? 'Edit & Review Kuis' : 'Buat Kuis Baru'}</h3>
              <button onClick={() => setShowQuizModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSaveQuiz} className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-blue-900 mb-1">Judul Kuis</label>
                <input 
                  type="text" 
                  className="w-full border border-blue-200 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  required 
                  value={quizTitle}
                  placeholder="Contoh: Kuis Pemahaman Dasar"
                  onChange={e => setQuizTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                   <h4 className="font-bold text-gray-800">Daftar Pertanyaan</h4>
                   <span className="text-xs text-gray-500 font-medium">{questions.length} Pertanyaan</span>
                </div>
                
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4 relative group">
                    <div className="flex justify-between items-center">
                       <span className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                         {qIdx + 1}
                       </span>
                       <button 
                         type="button"
                         onClick={() => {
                           const n = [...questions]; n.splice(qIdx, 1); setQuestions(n);
                         }}
                         className="text-gray-400 hover:text-red-500 transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>

                    <input 
                      type="text" 
                      placeholder="Tulis pertanyaan Anda di sini..."
                      className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                      value={q.question_text}
                      onChange={e => {
                        const n = [...questions]; n[qIdx].question_text = e.target.value; setQuestions(n);
                      }}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options_json.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                           <span className="text-xs font-bold text-gray-400">{['A','B','C','D'][oIdx]}</span>
                           <input 
                            placeholder={`Opsi ${['A','B','C','D'][oIdx]}`}
                            className="flex-1 border border-gray-300 p-2 rounded-md text-sm outline-none focus:border-blue-500"
                            value={opt}
                            onChange={e => {
                              const n = [...questions]; n[qIdx].options_json[oIdx] = e.target.value; setQuestions(n);
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <label className="block text-[10px] font-bold text-green-700 uppercase mb-1">Jawaban Benar</label>
                      <select 
                        className="w-full border border-green-200 p-2 rounded-md text-sm bg-white outline-none"
                        value={q.correct_answer}
                        required
                        onChange={e => {
                          const n = [...questions]; n[qIdx].correct_answer = e.target.value; setQuestions(n);
                        }}
                      >
                        <option value="">-- Pilih Jawaban yang Benar --</option>
                        {q.options_json.map((opt, i) => (
                          <option key={i} value={opt} disabled={!opt}>
                            {opt ? `Opsi ${['A','B','C','D'][i]}: ${opt}` : `Opsi ${['A','B','C','D'][i]} (Kosong)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 sticky bottom-0 bg-white py-4 border-t">
                <button type="button" onClick={() => setQuestions([...questions, { question_text: '', options_json: ['', '', '', ''], correct_answer: '' }])} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
                  + Tambah Pertanyaan
                </button>
                <Button type="submit" className="flex-1 shadow-lg shadow-blue-200">
                  {editingQuiz ? 'Simpan Perubahan Kuis' : 'Publikasikan Kuis'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCUSSION MODAL */}
      {showDiscussionModal && activeLessonId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">Diskusi dengan Siswa</h3>
              <button onClick={() => setShowDiscussionModal(false)}><X /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
               <DiscussionSection 
                 lessonId={activeLessonId} 
                 userId={mentorId || ''} 
               />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
