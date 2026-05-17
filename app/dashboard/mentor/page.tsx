'use client'

import React, { useState, useEffect } from 'react'
import { CourseService } from '@/services/courseService'
import { QuizService, ManualQuizInput } from '@/services/quizService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import { useRouter } from 'next/navigation'
import { Course, Lesson } from '@/types/database'
import { Plus, Edit, BookOpen, HelpCircle, X, ChevronRight, Trash2, Eye, MessageSquare, LayoutDashboard, Settings, MoreVertical, Play, FileText, Sparkles, CheckCircle2 } from 'lucide-react'
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
    e.stopPropagation()
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 animate-pulse uppercase tracking-widest text-xs">Menyiapkan Ruang Kerja Mentor...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              Mentor
            </span>
            <div className="flex items-center text-indigo-600 gap-1 animate-pulse">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">Kelola Ilmu Anda</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mentor Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Kelola kursus, publikasikan materi, dan berinteraksi dengan siswa.</p>
        </div>
        <Button 
          onClick={() => setShowAddCourseModal(true)} 
          className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 font-black text-sm"
          leftIcon={<Plus size={20} />}
        >
          Buat Kursus Baru
        </Button>
      </div>

      {!selectedCourse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myCourses.map((course) => (
            <div 
              key={course.id} 
              onClick={() => handleCourseClick(course)}
              className="group bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/20 border border-gray-100 p-8 hover:border-blue-500 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 group-hover:bg-blue-100 transition-colors" />
              
              <button 
                onClick={(e) => handleDeleteCourse(e, course.id)}
                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 z-10"
                title="Hapus Kursus"
              >
                <Trash2 size={18} />
              </button>

              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-inner">
                <BookOpen size={28} />
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{course.category}</span>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-4 group-hover:text-blue-600 transition-colors">{course.title}</h3>
              </div>
              
              <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center text-xs font-bold text-gray-400 gap-1.5 uppercase tracking-widest">
                  <Edit size={14} className="text-gray-300" /> Kelola Materi
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
          {myCourses.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-2xl shadow-gray-200/10">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutDashboard className="text-gray-300" size={48} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Belum Ada Kursus</h3>
              <p className="text-gray-500 max-w-xs mx-auto font-medium">Mulailah dengan membuat kursus pertama Anda untuk mulai mengajar.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="group flex items-center text-gray-400 hover:text-blue-600 font-bold mb-4 transition-all duration-300 text-sm uppercase tracking-widest"
          >
            <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <ArrowLeft size={16} />
            </div>
            Kembali ke Daftar Kursus
          </button>
          
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/20 border border-gray-100 overflow-hidden">
            <div className="p-10 md:p-14 border-b border-gray-50 bg-gradient-to-r from-white to-gray-50/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                  <span className="bg-blue-50 text-blue-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    {selectedCourse.category}
                  </span>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">{selectedCourse.title}</h2>
                </div>
                <Button 
                  onClick={() => handleOpenMaterialModal()} 
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 font-black text-sm"
                  leftIcon={<Plus size={20} />}
                >
                  Tambah Materi
                </Button>
              </div>
            </div>

            <div className="p-10 md:p-14 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Kurikulum Kursus</h3>
              </div>

              <div className="grid gap-4">
                {courseLessons.map((lesson, idx) => (
                  <div key={lesson.id} className="group flex flex-col xl:flex-row xl:items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 gap-6">
                    <div className="flex items-center gap-6 cursor-pointer flex-1" onClick={() => handleOpenMaterialModal(lesson)}>
                      <div className="w-12 h-12 bg-white text-gray-900 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">{lesson.title}</h4>
                        <div className="flex items-center gap-4">
                           {lesson.youtube_url && (
                             <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-full">
                               <Play size={10} fill="currentColor" /> Video
                             </span>
                           )}
                           {lesson.pdf_url && (
                             <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">
                               <FileText size={10} /> PDF
                             </span>
                           )}
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-2">
                             <Edit size={12} /> Edit Materi
                           </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-4 xl:pt-0 border-t xl:border-0 border-gray-100">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenDiscussion(lesson.id)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white rounded-xl shadow-sm border border-gray-100 px-4"
                        leftIcon={<MessageSquare size={16} />}
                      >
                        Diskusi
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenQuizModal(lesson.id)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white rounded-xl shadow-sm border border-gray-100 px-4"
                        leftIcon={<HelpCircle size={16} />}
                      >
                        Kuis
                      </Button>
                      <div className="w-px h-6 bg-gray-200 mx-2 hidden xl:block" />
                      <button 
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                        title="Hapus Materi"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {courseLessons.length === 0 && (
                  <div className="text-center py-16 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 font-bold italic">Belum ada materi. Klik "Tambah Materi" di atas untuk mulai membangun kurikulum.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Buat Kursus Baru</h3>
              <button 
                onClick={() => setShowAddCourseModal(false)}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Judul Kursus</label>
                <input 
                  type="text" 
                  className="block w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  placeholder="Contoh: Dasar-dasar React Native"
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Kategori</label>
                <input 
                  type="text" 
                  className="block w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  placeholder="Contoh: Mobile Development"
                  value={newCourse.category}
                  onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full py-5 rounded-[1.5rem] font-black shadow-xl shadow-blue-500/20">
                Publikasikan Kursus
              </Button>
            </form>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-8 md:p-10 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {editingLesson ? 'Edit & Preview Materi' : 'Tambah Materi Baru'}
              </h3>
              <button 
                onClick={() => setShowMaterialModal(false)}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSaveMaterial} className="p-8 md:p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Judul Materi</label>
                <input 
                  type="text" 
                  className="block w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  placeholder="Contoh: Pengenalan Komponen & Props"
                  value={materialForm.title}
                  onChange={e => setMaterialForm({...materialForm, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Isi Konten (Teks)</label>
                <textarea 
                  className="block w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium h-48 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none" 
                  required 
                  placeholder="Tuliskan materi pembelajaran secara detail..."
                  value={materialForm.content}
                  onChange={e => setMaterialForm({...materialForm, content: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Link YouTube</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-red-400">
                      <Play size={18} fill="currentColor" />
                    </div>
                    <input 
                      type="text" 
                      className="block w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                      value={materialForm.youtube_url}
                      placeholder="https://youtube.com/watch?v=..."
                      onChange={e => setMaterialForm({...materialForm, youtube_url: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Link Materi PDF</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-blue-400">
                      <FileText size={18} />
                    </div>
                    <input 
                      type="text" 
                      className="block w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-sm font-medium transition-all duration-300 focus:bg-white focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                      value={materialForm.pdf_url}
                      placeholder="https://example.com/file.pdf"
                      onChange={e => setMaterialForm({...materialForm, pdf_url: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW SECTION */}
              {editingLesson && (
                <div className="mt-12 pt-12 border-t border-gray-100">
                   <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Live Preview Tampilan Siswa</h4>
                   </div>
                   <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-500/5">
                      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-4">{materialForm.title}</h1>
                      <div className="prose prose-blue max-w-none text-gray-600 font-medium whitespace-pre-wrap leading-relaxed text-sm">
                        {materialForm.content}
                      </div>
                   </div>
                </div>
              )}

              <Button type="submit" className="w-full py-5 rounded-[1.5rem] font-black shadow-xl shadow-blue-500/20 text-lg">
                {editingLesson ? 'Simpan Perubahan Materi' : 'Publikasikan Materi'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {showQuizModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-8 md:p-10 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {editingQuiz ? 'Edit & Review Kuis' : 'Buat Kuis Baru'}
              </h3>
              <button onClick={() => setShowQuizModal(false)}><X /></button>
            </div>
            <form onSubmit={handleSaveQuiz} className="p-8 md:p-10 space-y-10">
              <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100/50">
                <label className="text-xs font-black text-blue-900/50 uppercase tracking-[0.2em] ml-1 mb-2 block">Judul Kuis</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-blue-100 px-6 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-300 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  value={quizTitle}
                  placeholder="Contoh: Kuis Pemahaman Dasar"
                  onChange={e => setQuizTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                   <h4 className="text-xl font-black text-gray-900 tracking-tight">Daftar Pertanyaan</h4>
                   <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {questions.length} Pertanyaan
                   </span>
                </div>
                
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 relative group transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-gray-200/20">
                    <div className="flex justify-between items-center">
                       <div className="w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-xs font-black shadow-lg shadow-gray-900/10">
                         {qIdx + 1}
                       </div>
                       <button 
                         type="button"
                         onClick={() => {
                           const n = [...questions]; n.splice(qIdx, 1); setQuestions(n);
                         }}
                         className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teks Pertanyaan</label>
                      <input 
                        type="text" 
                        placeholder="Tulis pertanyaan Anda di sini..."
                        className="w-full bg-white border border-gray-100 px-6 py-4 rounded-[1.5rem] text-sm font-bold transition-all duration-300 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                        value={q.question_text}
                        onChange={e => {
                          const n = [...questions]; n[qIdx].question_text = e.target.value; setQuestions(n);
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options_json.map((opt, oIdx) => (
                        <div key={oIdx} className="space-y-1">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Opsi {['A','B','C','D'][oIdx]}</label>
                           <input 
                            placeholder={`Tulis pilihan jawaban...`}
                            className="w-full bg-white border border-gray-100 px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 focus:border-blue-500 outline-none"
                            value={opt}
                            onChange={e => {
                              const n = [...questions]; n[qIdx].options_json[oIdx] = e.target.value; setQuestions(n);
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100/50">
                      <label className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase mb-3 ml-1 tracking-widest">
                        <CheckCircle2 size={12} /> Jawaban Benar
                      </label>
                      <select 
                        className="w-full bg-white border border-emerald-100 px-6 py-4 rounded-[1.5rem] text-sm font-bold outline-none cursor-pointer hover:border-emerald-500 transition-colors"
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

              <div className="flex flex-col md:flex-row gap-4 sticky bottom-0 bg-white/80 backdrop-blur-md py-6 border-t border-gray-100 z-20">
                <button 
                  type="button" 
                  onClick={() => setQuestions([...questions, { question_text: '', options_json: ['', '', '', ''], correct_answer: '' }])} 
                  className="bg-gray-100 text-gray-700 px-8 py-5 rounded-[1.5rem] hover:bg-gray-900 hover:text-white transition-all duration-300 font-black text-sm uppercase tracking-widest"
                >
                  + Tambah Pertanyaan
                </button>
                <Button type="submit" className="flex-1 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-blue-500/20">
                  {editingQuiz ? 'Simpan Perubahan Kuis' : 'Publikasikan Kuis'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCUSSION MODAL */}
      {showDiscussionModal && activeLessonId && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Diskusi dengan Siswa</h3>
              <button 
                onClick={() => setShowDiscussionModal(false)}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X />
              </button>
            </div>
            <div className="p-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
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

// Minimal placeholder for missing icons
const ArrowLeft = ({ size, className }: { size?: number, className?: string }) => (
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
    <path d="m12 19-7-7 7-7"></path>
    <path d="M19 12H5"></path>
  </svg>
)
