'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CourseService } from '@/services/courseService'
import { QuizService, ManualQuizInput } from '@/services/quizService'
import { MentorService } from '@/services/mentorService'
import { Button } from '@/components/ui/Button'
import { AuthService } from '@/services/authService'
import { useRouter } from 'next/navigation'
import { Course, Lesson, Portfolio } from '@/types/database'
import { Plus, Edit, BookOpen, HelpCircle, X, ChevronRight, Trash2, Eye, MessageSquare, Settings, Play, Sparkles, CheckCircle2, Briefcase, ExternalLink, FileText, Upload, Download, Award, Palette, Type, GraduationCap } from 'lucide-react'
import { DiscussionSection } from '@/components/features/DiscussionSection'
import { CertificateService } from '@/services/certificateService'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { useToast } from '@/components/ui/Toast'
import Image from 'next/image'

export default function MentorDashboard() {
  const { showToast } = useToast()
  const [mentorId, setMentorId] = useState<string | null>(null)
  const [mentorPoints, setMentorPoints] = useState(0)
  const [activeTab, setActiveTab] = useState<'courses' | 'portfolio'>('courses')
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [myPortfolios, setMyPortfolios] = useState<Portfolio[]>([])
  const [mentorBio, setMentorBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([])
  
  // Modal States
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [showDiscussionModal, setShowDiscussionModal] = useState(false)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  
  // Edit States
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<{id: string, title: string} | null>(null)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()

  // Form States
  const [newCourse, setNewCourse] = useState({ title: '', category: '', cover_url: '' })

  const COURSE_CATEGORIES = [
    { value: 'design',       label: 'Design' },
    { value: 'programming',  label: 'Programming' },
    { value: 'business',     label: 'Business' },
    { value: 'marketing',    label: 'Marketing' },
    { value: 'data-science', label: 'Data Science' },
  ]
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', url: '', image_url: '' })
  const [materialForm, setMaterialForm] = useState({ title: '', content: '', youtube_url: '', pdf_url: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<ManualQuizInput['questions']>([
    { question_text: '', options_json: ['', '', '', ''], correct_answer: '' }
  ])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Certificate Form States
  const [certForm, setCertForm] = useState({
    title_text: 'Sertifikat Kelulusan',
    description_text: 'Dengan ini menyatakan bahwa',
    signature_name: '',
    primary_color: '#2563eb',
    template_url: ''
  })
  const [selectedCertFile, setSelectedCertFile] = useState<File | null>(null)
  const [uploadingCert, setUploadingCert] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      const session = await AuthService.getSession()
      if (session?.user) {
        setMentorId(session.user.id)
        await Promise.all([
          refreshCourses(session.user.id),
          refreshPortfolio(session.user.id)
        ])
        const profile = await AuthService.getUserProfile(session.user.id)
        setMentorBio(profile.bio || '')
        setMentorPoints(profile.points || 0)
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

  const refreshPortfolio = async (id: string) => {
    try {
      const portfolios = await MentorService.getMentorPortfolios(id)
      setMyPortfolios(portfolios)
    } catch (err) {
      console.error('Error loading portfolios:', err)
    }
  }

  const handleUpdateBio = async () => {
    if (!mentorId) return
    try {
      await MentorService.updateMentorBio(mentorId, mentorBio)
      showToast('Bio berhasil diperbarui!', 'success')
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
    }
  }

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mentorId) return
    try {
      if (editingPortfolio) {
        // Best-effort delete old image if replaced
        if (
          editingPortfolio.image_url &&
          portfolioForm.image_url !== editingPortfolio.image_url
        ) {
          MentorService.deletePortfolioImage(editingPortfolio.image_url)
        }
        await MentorService.updatePortfolio(editingPortfolio.id, portfolioForm)
        showToast('Portofolio berhasil diperbarui!', 'success')
      } else {
        await MentorService.addPortfolio({ ...portfolioForm, mentor_id: mentorId })
        showToast('Portofolio berhasil ditambahkan!', 'success')
      }
      await refreshPortfolio(mentorId)
      setShowPortfolioModal(false)
      setEditingPortfolio(null)
      setPortfolioForm({ title: '', description: '', url: '', image_url: '' })
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
    }
  }

  const handleOpenPortfolioModal = (portfolio?: Portfolio) => {
    if (portfolio) {
      setEditingPortfolio(portfolio)
      setPortfolioForm({
        title: portfolio.title,
        description: portfolio.description || '',
        url: portfolio.url || '',
        image_url: portfolio.image_url || ''
      })
    } else {
      setEditingPortfolio(null)
      setPortfolioForm({ title: '', description: '', url: '', image_url: '' })
    }
    setShowPortfolioModal(true)
  }

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Hapus item portofolio ini? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      // Find the item to get its image_url for cleanup
      const item = myPortfolios.find(p => p.id === id)
      await MentorService.deletePortfolio(id)
      // Best-effort delete storage image after DB row removed
      if (item?.image_url) {
        MentorService.deletePortfolioImage(item.image_url)
      }
      if (mentorId) await refreshPortfolio(mentorId)
      showToast('Item portofolio berhasil dihapus.', 'info')
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
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
      setNewCourse({ title: '', category: '', cover_url: '' })
      showToast('Kursus baru berhasil dibuat!', 'success')
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
    }
  }

  const handleDeleteCourse = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation()
    if (!confirm('Hapus kursus ini beserta seluruh materi di dalamnya?')) return
    try {
      await CourseService.deleteCourse(courseId)
      setMyCourses(myCourses.filter(c => c.id !== courseId))
      showToast('Kursus berhasil dihapus.', 'info')
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
    }
  }

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return
    setLoading(true)
    try {
      let finalPdfUrl = materialForm.pdf_url

      // Handle PDF Upload if file selected
      if (selectedFile) {
        setUploadingFile(true)
        // We need a temporary lesson ID for new lessons or use the existing one
        const tempId = editingLesson?.id || crypto.randomUUID()
        finalPdfUrl = await CourseService.uploadMaterial(selectedCourse.id, tempId, selectedFile)
        setUploadingFile(false)
      }

      const materialData = {
        title: materialForm.title,
        content: materialForm.content,
        youtube_url: materialForm.youtube_url,
        pdf_url: finalPdfUrl
      }

      if (editingLesson) {
        await CourseService.updateLesson(editingLesson.id, materialData)
        showToast('Materi berhasil diperbarui!', 'success')
      } else {
        await CourseService.addLesson({ ...materialData, course_id: selectedCourse.id })
        showToast('Materi baru berhasil ditambahkan!', 'success')
      }
      await refreshLessons(selectedCourse.id)
      setShowMaterialModal(false)
      setEditingLesson(null)
      setSelectedFile(null)
      setMaterialForm({ title: '', content: '', youtube_url: '', pdf_url: '' })
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
    } finally {
      setLoading(false)
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
    setSelectedFile(null)
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
        showToast('Kuis berhasil diperbarui!', 'success')
      } else {
        await QuizService.createManualQuiz({
          lesson_id: activeLessonId,
          title: quizTitle,
          questions: questions
        })
        showToast('Kuis berhasil dibuat!', 'success')
      }
      setShowQuizModal(false)
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
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
      showToast('Materi berhasil dihapus.', 'info')
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
    }
  }

  const handleOpenCertificateModal = async () => {
    if (!selectedCourse) return
    try {
      const cert = await CertificateService.getCertificateByCourseId(selectedCourse.id)
      if (cert) {
        setCertForm({
          title_text: cert.title_text,
          description_text: cert.description_text,
          signature_name: cert.signature_name || '',
          primary_color: cert.primary_color,
          template_url: cert.template_url || ''
        })
      } else {
        setCertForm({
          title_text: 'Sertifikat Kelulusan',
          description_text: 'Dengan ini menyatakan bahwa',
          signature_name: '',
          primary_color: '#2563eb',
          template_url: ''
        })
      }
      setShowCertificateModal(true)
    } catch (err) {
      console.error('Error loading certificate:', err)
    }
  }

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse || !mentorId) return
    setLoading(true)
    try {
      let finalTemplateUrl = certForm.template_url

      if (selectedCertFile) {
        setUploadingCert(true)
        finalTemplateUrl = await CertificateService.uploadTemplate(selectedCourse.id, selectedCertFile)
        setUploadingCert(false)
      }

      await CertificateService.saveCertificate({
        ...certForm,
        course_id: selectedCourse.id,
        mentor_id: mentorId,
        template_url: finalTemplateUrl
      })
      showToast('Pengaturan sertifikat berhasil disimpan!', 'success')
      setSelectedCertFile(null) // Clear local file preview
      setShowCertificateModal(false)
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 dark:text-slate-400 animate-pulse uppercase tracking-widest text-xs">Menyiapkan Ruang Kerja Mentor...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 animate-in fade-in duration-500">
      {/* ── Welcome header with illustration ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/20 dark:shadow-none p-6 md:p-10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 dark:from-indigo-950/20 to-transparent pointer-events-none" />

        {/* Illustration */}
        <div className="w-full md:w-64 flex-shrink-0">
          <ImageSlot
            src="/illustrations/dashboard-mentor.svg"
            alt="Mentor mengajar di papan presentasi"
            aspectRatio="16/9"
            priority
          />
        </div>

        <div className="relative z-10 flex-1 space-y-5">
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                Mentor
              </span>
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/70 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/60 shadow-sm">
                <Sparkles size={12} className="text-amber-500 dark:text-amber-400" />
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">
                  {mentorPoints} Poin
                </span>
              </div>
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 gap-1 animate-pulse">
                <Sparkles size={13} />
                <span className="text-[10px] font-black uppercase tracking-wider">Kelola Ilmu Anda</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Mentor Dashboard</h1>
            <p className="text-gray-500 dark:text-slate-400 font-medium mt-1 text-sm">Kelola kursus, publikasikan materi, dan berinteraksi dengan siswa.</p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/80 px-5 py-3 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
                <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xl font-black text-gray-900 dark:text-slate-100">{myCourses.length}</div>
                <div className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Kursus</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/80 px-5 py-3 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                <GraduationCap size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-xl font-black text-gray-900 dark:text-slate-100">{myCourses.length > 0 ? '—' : '0'}</div>
                <div className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Siswa</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800/80 px-5 py-3 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-xl font-black text-gray-900 dark:text-slate-100">{mentorPoints}</div>
                <div className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Poin</div>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-3 pt-1">
            <Button
              onClick={() => { setActiveTab('courses'); setSelectedCourse(null); }}
              variant={activeTab === 'courses' ? 'primary' : 'outline'}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm"
              leftIcon={<BookOpen size={18} />}
            >
              Kursus Saya
            </Button>
            <Button
              onClick={() => setActiveTab('portfolio')}
              variant={activeTab === 'portfolio' ? 'primary' : 'outline'}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm"
              leftIcon={<Briefcase size={18} />}
            >
              Portofolio
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'courses' ? (
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
              {selectedCourse ? 'Detail Kursus' : 'Daftar Kursus'}
            </h2>
            {!selectedCourse && (
              <Button 
                onClick={() => setShowAddCourseModal(true)} 
                className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 font-black text-sm"
                leftIcon={<Plus size={20} />}
              >
                Buat Kursus Baru
              </Button>
            )}
          </div>

          {!selectedCourse ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myCourses.map((course) => {
                const coverSrc = (course as any).cover_url
                  ? (course as any).cover_url
                  : `/illustrations/categories/${(course.category ?? 'default').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default'}.svg`
                return (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className="group bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 relative overflow-hidden"
                  >
                    {/* Cover image */}
                    <div className="relative">
                      <ImageSlot
                        src={coverSrc}
                        alt={course.title}
                        aspectRatio="16/9"
                        rounded={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                      {/* Category chip */}
                      <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow">
                        {course.category || 'Umum'}
                      </span>
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteCourse(e, course.id)}
                        className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-red-50 dark:hover:bg-red-950/60 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all duration-300 shadow z-10 focus-visible:outline-2 focus-visible:outline-red-500 min-h-9 min-w-9 flex items-center justify-center"
                        title="Hapus Kursus"
                        aria-label="Hapus kursus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Card body */}
                    <div className="p-6 space-y-2">
                      <h3 className="text-lg font-black text-gray-900 dark:text-slate-100 tracking-tight leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800">
                        <div className="flex items-center text-xs font-bold text-gray-400 dark:text-slate-500 gap-1.5 uppercase tracking-widest">
                          <Edit size={13} className="text-gray-300 dark:text-slate-600" /> Kelola Materi
                        </div>
                        <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                )
              })}
              {myCourses.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/10 dark:shadow-none flex flex-col items-center gap-6">
                  <div className="w-56 max-w-full">
                    <ImageSlot
                      src="/illustrations/empty-courses.svg"
                      alt="Belum ada kursus"
                      aspectRatio="4/3"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-2 tracking-tight">Belum Ada Kursus</h3>
                    <p className="text-gray-500 dark:text-slate-400 max-w-xs mx-auto font-medium text-sm mb-5">
                      Mulailah dengan membuat kursus pertama Anda untuk mulai mengajar.
                    </p>
                    <Button
                      onClick={() => setShowAddCourseModal(true)}
                      className="px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 font-black text-sm"
                      leftIcon={<Plus size={18} />}
                    >
                      Buat Kursus Pertama Anda
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
              <button 
                onClick={() => setSelectedCourse(null)}
                className="group flex items-center text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold mb-4 transition-all duration-300 text-sm uppercase tracking-widest"
              >
                <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg mr-3 group-hover:bg-blue-50 dark:group-hover:bg-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <ArrowLeft size={16} />
                </div>
                Kembali ke Daftar Kursus
              </button>
              
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* Course cover banner */}
                {selectedCourse && (
                  <div className="relative h-40 overflow-hidden">
                    <ImageSlot
                      src={
                        (selectedCourse as any).cover_url
                          ? (selectedCourse as any).cover_url
                          : `/illustrations/categories/${(selectedCourse.category ?? 'default').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default'}.svg`
                      }
                      alt={selectedCourse.title}
                      aspectRatio="16/5"
                      rounded={false}
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}
                <div className="p-10 md:p-14 border-b border-gray-50 dark:border-slate-800 bg-gradient-to-r from-white to-gray-50/50 dark:from-slate-900 dark:to-slate-850">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-2">
                      <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                        {selectedCourse.category}
                      </span>
                      <h2 className="text-4xl font-black text-gray-900 dark:text-slate-100 tracking-tight">{selectedCourse.title}</h2>
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
                    <div className="w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-full" />
                    <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Kurikulum Kursus</h3>
                  </div>

                  <div className="grid gap-4">
                    {courseLessons.map((lesson, idx) => (
                      <div key={lesson.id} className="group flex flex-col xl:flex-row xl:items-center justify-between p-6 bg-gray-50/50 dark:bg-slate-800/50 rounded-[2rem] border border-gray-100 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 gap-6">
                        <div className="flex items-center gap-6 cursor-pointer flex-1" onClick={() => handleOpenMaterialModal(lesson)}>
                          <div className="w-12 h-12 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm border border-gray-100 dark:border-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            {idx + 1}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-black text-gray-900 dark:text-slate-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{lesson.title}</h4>
                            <div className="flex items-center gap-4">
                               {lesson.youtube_url && (
                                 <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full">
                                   <Play size={10} fill="currentColor" /> Video
                                 </span>
                               )}
                               <span className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-2">
                                 <Edit size={12} /> Edit Materi
                                </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-4 xl:pt-0 border-t xl:border-0 border-gray-100 dark:border-slate-700/60">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenCertificateModal()}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/60 px-4 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                            leftIcon={<Award size={16} />}
                          >
                            Sertifikat
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenDiscussion(lesson.id)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 px-4 hover:bg-gray-50 dark:hover:bg-slate-700"
                            leftIcon={<MessageSquare size={16} />}
                          >
                            Diskusi
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenQuizModal(lesson.id)}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 px-4 hover:bg-gray-50 dark:hover:bg-slate-700"
                            leftIcon={<HelpCircle size={16} />}
                          >
                            Kuis
                          </Button>
                          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-2 hidden xl:block" />
                          <button 
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-3 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-red-500"
                            title="Hapus Materi"
                            aria-label="Hapus materi"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {courseLessons.length === 0 && (
                      <div className="text-center py-14 bg-gray-50/50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-slate-700/60 flex flex-col items-center gap-5">
                        <div className="w-44 max-w-full">
                          <ImageSlot
                            src="/illustrations/empty-lessons.svg"
                            alt="Belum ada materi"
                            aspectRatio="4/3"
                          />
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-slate-400 font-bold text-sm mb-3">Belum ada materi dalam kursus ini.</p>
                          <Button
                            onClick={() => handleOpenMaterialModal()}
                            className="px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/15 font-black text-sm"
                            leftIcon={<Plus size={16} />}
                          >
                            Tambah Materi Pertama
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-slate-800 p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Bio Mentor</h3>
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-medium mb-6">Tuliskan deskripsi singkat tentang pengalaman dan keahlian Anda untuk dilihat oleh calon siswa.</p>
            <textarea 
              value={mentorBio}
              onChange={(e) => setMentorBio(e.target.value)}
              placeholder="Contoh: Saya adalah software engineer dengan pengalaman 5 tahun di bidang web development..."
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-6 py-4 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 h-32 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none mb-6"
            />
            <Button onClick={handleUpdateBio} className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest">
              Simpan Bio
            </Button>
          </section>

          <section>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-600 dark:bg-blue-500 rounded-full" />
                <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Daftar Portofolio</h3>
              </div>
              <Button 
                onClick={() => handleOpenPortfolioModal()} 
                className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 font-black text-sm"
                leftIcon={<Plus size={20} />}
              >
                Tambah Item
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myPortfolios.map((portfolio) => (
                <div key={portfolio.id} className="group bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 relative flex flex-col focus-within:ring-2 focus-within:ring-blue-500">
                  {/* Cover image */}
                  <div className="relative aspect-video overflow-hidden shrink-0">
                    {portfolio.image_url ? (
                      <Image
                        src={portfolio.image_url}
                        alt={portfolio.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 dark:brightness-95"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        loading="lazy"
                      />
                    ) : (
                      <ImageSlot
                        src="/illustrations/portfolio-default.svg"
                        alt={portfolio.title}
                        aspectRatio="16/9"
                        rounded={false}
                      />
                    )}
                    {/* Action buttons overlay */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleOpenPortfolioModal(portfolio)}
                        className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Edit portofolio: ${portfolio.title}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePortfolio(portfolio.id)}
                        className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Hapus portofolio: ${portfolio.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col space-y-2">
                    <h4 className="text-base font-black text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug break-words line-clamp-2">
                      {portfolio.title}
                    </h4>
                    {portfolio.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-400 font-medium line-clamp-2 flex-1">{portfolio.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800 mt-auto">
                      {portfolio.url ? (
                        <a href={portfolio.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:gap-3 transition-all"
                          onClick={e => e.stopPropagation()}
                        >
                          Lihat Project <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span />
                      )}
                      <button
                        onClick={() => handleOpenPortfolioModal(portfolio)}
                        className="text-xs font-black text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {myPortfolios.length === 0 && (
                <div className="col-span-full py-16 text-center bg-gray-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
                  <div className="w-32 mx-auto mb-4">
                    <ImageSlot
                      src="/illustrations/portfolio-default.svg"
                      alt="Belum ada portofolio"
                      aspectRatio="4/3"
                    />
                  </div>
                  <p className="text-gray-400 dark:text-slate-500 font-bold text-sm mb-4">Belum ada portofolio.</p>
                  <button
                    onClick={() => handleOpenPortfolioModal()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[44px]"
                  >
                    <Plus size={16} /> Tambah Item Pertama
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">Lihat Tampilan Publik</h3>
                <p className="text-blue-100 font-medium">Lihat bagaimana siswa melihat profil dan portofolio Anda.</p>
              </div>
              <Button 
                onClick={() => router.push(`/mentors/${mentorId}`)}
                variant="outline" 
                className="bg-white border-none text-blue-600 hover:bg-blue-50 px-10 py-4 rounded-2xl font-black"
                leftIcon={<Eye size={20} />}
              >
                Preview Profil
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAddCourseModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800">
            <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Buat Kursus Baru</h3>
              <button 
                onClick={() => setShowAddCourseModal(false)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded-xl"
                aria-label="Tutup modal"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Judul Kursus</label>
                <input 
                  type="text" 
                  className="block w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  placeholder="Contoh: Dasar-dasar React Native"
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Kategori</label>
                <select
                  required
                  className="block w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none appearance-none"
                  value={newCourse.category}
                  onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                >
                  <option value="" disabled>Pilih kategori...</option>
                  {COURSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <ImageUploader
                  label={<>Gambar Cover <span className="normal-case font-medium text-gray-300 dark:text-slate-500">(opsional)</span></>}
                  value={newCourse.cover_url || null}
                  onChange={(url) => setNewCourse({ ...newCourse, cover_url: url ?? '' })}
                  onUpload={async (file) => {
                    if (!mentorId) throw new Error('Belum login.')
                    return CourseService.uploadCourseCover(mentorId, file)
                  }}
                  aspectRatio="16/9"
                />
                <p className="ml-2 text-[11px] text-gray-400 dark:text-slate-500">Kosongkan untuk menggunakan ilustrasi kategori otomatis.</p>
              </div>
              <Button type="submit" className="w-full py-5 rounded-[1.5rem] font-black shadow-xl shadow-blue-500/20">
                Publikasikan Kursus
              </Button>
            </form>
          </div>
        </div>
      )}

      {showPortfolioModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                {editingPortfolio ? 'Edit Portofolio' : 'Tambah Portofolio'}
              </h3>
              <button 
                onClick={() => { setShowPortfolioModal(false); setEditingPortfolio(null); setPortfolioForm({ title: '', description: '', url: '', image_url: '' }) }}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Tutup modal"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSavePortfolio} className="p-8 space-y-6 overflow-y-auto">
              {/* Image upload */}
              <ImageUploader
                label={<>Gambar Cover <span className="normal-case font-medium text-gray-300 dark:text-slate-500">(opsional)</span></>}
                value={portfolioForm.image_url || null}
                onChange={(url) => setPortfolioForm({ ...portfolioForm, image_url: url ?? '' })}
                onUpload={async (file) => {
                  if (!mentorId) throw new Error('Belum login.')
                  return MentorService.uploadPortfolioImage(
                    mentorId,
                    file,
                    editingPortfolio?.image_url
                  )
                }}
                aspectRatio="16/9"
              />
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Judul Project/Pencapaian</label>
                <input 
                  type="text" 
                  className="block w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  placeholder="Contoh: Senior Web Developer di Tech Corp"
                  value={portfolioForm.title}
                  onChange={e => setPortfolioForm({...portfolioForm, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Deskripsi Singkat</label>
                <textarea 
                  className="block w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 h-28 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none" 
                  placeholder="Jelaskan peran atau detail project Anda..."
                  value={portfolioForm.description}
                  onChange={e => setPortfolioForm({...portfolioForm, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Link Eksternal <span className="normal-case font-medium text-gray-300 dark:text-slate-500">(opsional)</span></label>
                <input 
                  type="text" 
                  className="block w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  placeholder="https://portfolio-anda.com"
                  value={portfolioForm.url}
                  onChange={e => setPortfolioForm({...portfolioForm, url: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full py-5 rounded-[1.5rem] font-black shadow-xl shadow-blue-500/20">
                {editingPortfolio ? 'Simpan Perubahan' : 'Tambah ke Portofolio'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-800">
            <div className="p-8 md:p-10 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                {editingLesson ? 'Edit & Preview Materi' : 'Tambah Materi Baru'}
              </h3>
              <button 
                onClick={() => setShowMaterialModal(false)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded-xl"
                aria-label="Tutup modal"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSaveMaterial} className="p-8 md:p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Judul Materi</label>
                <input 
                  type="text" 
                  className="block w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  placeholder="Contoh: Pengenalan Komponen & Props"
                  value={materialForm.title}
                  onChange={e => setMaterialForm({...materialForm, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Isi Konten (Teks)</label>
                <textarea 
                  className="block w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 h-48 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none" 
                  required 
                  placeholder="Tuliskan materi pembelajaran secara detail..."
                  value={materialForm.content}
                  onChange={e => setMaterialForm({...materialForm, content: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Link YouTube</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-red-400">
                      <Play size={18} fill="currentColor" />
                    </div>
                    <input 
                      type="text" 
                      className="block w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                      value={materialForm.youtube_url}
                      placeholder="https://youtube.com/watch?v=..."
                      onChange={e => setMaterialForm({...materialForm, youtube_url: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Materi PDF (Optional)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf"
                      id="pdf-upload"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="pdf-upload"
                      className={`flex items-center gap-3 w-full px-6 py-4 bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-200 dark:border-slate-700 rounded-[1.5rem] cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all ${selectedFile ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : ''}`}
                    >
                      <div className={`p-2 rounded-xl ${selectedFile ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-gray-400 dark:text-slate-300'}`}>
                        <Upload size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                          {selectedFile ? selectedFile.name : (materialForm.pdf_url ? 'Ganti File PDF' : 'Upload File PDF')}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Maksimal 10MB</p>
                      </div>
                    </label>
                  </div>
                  {materialForm.pdf_url && !selectedFile && (
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 ml-1">
                      <CheckCircle2 size={10} /> File PDF sudah terunggah
                    </p>
                  )}
                </div>
              </div>

              {/* LIVE PREVIEW SECTION */}
              {(editingLesson || materialForm.title) && (
                <div className="mt-12 pt-12 border-t border-gray-100 dark:border-slate-800">
                   <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h4 className="text-sm font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Live Preview Tampilan Siswa</h4>
                   </div>
                   <div className="bg-white dark:bg-slate-850 p-10 rounded-[2.5rem] border border-gray-100 dark:border-slate-750 shadow-xl shadow-blue-500/5">
                      <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight mb-4">{materialForm.title || 'Judul Materi'}</h1>
                      <div className="prose prose-blue dark:prose-invert max-w-none text-gray-600 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed text-sm mb-8">
                        {materialForm.content || 'Isi konten materi akan muncul di sini...'}
                      </div>
                      {(selectedFile || materialForm.pdf_url) && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-900/60">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 text-white rounded-xl">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-blue-900 dark:text-blue-200">Materi Tambahan (PDF)</p>
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">Siap Diunduh oleh Siswa</p>
                            </div>
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm">
                            <Download size={18} />
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              )}

              <Button 
                type="submit" 
                isLoading={uploadingFile || loading}
                className="w-full py-5 rounded-[1.5rem] font-black shadow-xl shadow-blue-500/20 text-lg"
              >
                {uploadingFile ? 'Mengunggah PDF...' : (editingLesson ? 'Simpan Perubahan Materi' : 'Publikasikan Materi')}
              </Button>
            </form>
          </div>
        </div>
      )}

      {showQuizModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-800">
            <div className="p-8 md:p-10 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
                {editingQuiz ? 'Edit & Review Kuis' : 'Buat Kuis Baru'}
              </h3>
              <button
                onClick={() => setShowQuizModal(false)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded-xl"
                aria-label="Tutup modal"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSaveQuiz} className="p-8 md:p-10 space-y-10">
              <div className="bg-blue-50/50 dark:bg-blue-950/40 p-8 rounded-[2rem] border border-blue-100/50 dark:border-blue-900/50">
                <label className="text-xs font-black text-blue-900/50 dark:text-blue-300/70 uppercase tracking-[0.2em] ml-1 mb-2 block">Judul Kuis</label>
                <input 
                  type="text" 
                  className="w-full bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 px-6 py-4 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none" 
                  required 
                  value={quizTitle}
                  placeholder="Contoh: Kuis Pemahaman Dasar"
                  onChange={e => setQuizTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-4">
                   <h4 className="text-xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Daftar Pertanyaan</h4>
                   <span className="bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
                    {questions.length} Pertanyaan
                   </span>
                </div>
                
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-8 bg-gray-50 dark:bg-slate-850 rounded-[2.5rem] border border-gray-100 dark:border-slate-750 space-y-6 relative group transition-all duration-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-gray-200/20 dark:hover:shadow-none">
                    <div className="flex justify-between items-center">
                       <div className="w-10 h-10 bg-gray-900 dark:bg-slate-700 text-white rounded-2xl flex items-center justify-center text-xs font-black shadow-lg shadow-gray-900/10">
                         {qIdx + 1}
                       </div>
                       <button 
                         type="button"
                         onClick={() => {
                           const n = [...questions]; n.splice(qIdx, 1); setQuestions(n);
                         }}
                         className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-red-500 min-h-9 min-w-9 flex items-center justify-center"
                         aria-label={`Hapus pertanyaan ${qIdx + 1}`}
                         title="Hapus pertanyaan"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">Teks Pertanyaan</label>
                      <input 
                        type="text" 
                        placeholder="Tulis pertanyaan Anda di sini..."
                        className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-6 py-4 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                        value={q.question_text}
                        onChange={e => {
                          const n = [...questions]; n[qIdx].question_text = e.target.value; setQuestions(n);
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options_json.map((opt, oIdx) => (
                        <div key={oIdx} className="space-y-1">
                           <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest ml-1">Opsi {['A','B','C','D'][oIdx]}</label>
                           <input 
                            placeholder={`Tulis pilihan jawaban...`}
                            className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-5 py-3 rounded-2xl text-xs font-bold text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-300 focus:border-blue-500 outline-none"
                            value={opt}
                            onChange={e => {
                              const n = [...questions]; n[qIdx].options_json[oIdx] = e.target.value; setQuestions(n);
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-950/40 p-6 rounded-[2rem] border border-emerald-100/50 dark:border-emerald-900/60">
                      <label className="flex items-center gap-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase mb-3 ml-1 tracking-widest">
                        <CheckCircle2 size={12} /> Jawaban Benar
                      </label>
                      <select 
                        className="w-full bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/70 px-6 py-4 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-slate-100 outline-none cursor-pointer hover:border-emerald-500 transition-colors"
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

              <div className="flex flex-col md:flex-row gap-4 sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-6 border-t border-gray-100 dark:border-slate-800 z-20">
                <button 
                  type="button" 
                  onClick={() => setQuestions([...questions, { question_text: '', options_json: ['', '', '', ''], correct_answer: '' }])} 
                  className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 px-8 py-5 rounded-[1.5rem] hover:bg-gray-900 dark:hover:bg-slate-700 hover:text-white transition-all duration-300 font-black text-sm uppercase tracking-widest"
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

      {/* CERTIFICATE MODAL */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-5xl shadow-2xl max-h-[95vh] overflow-y-auto border border-white/20 dark:border-slate-800">
            <div className="p-8 md:p-10 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-300 rounded-2xl">
                  <Award size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">Desain Sertifikat Kursus</h3>
                  <p className="text-sm text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest">Kustomisasi sertifikat untuk siswa Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCertificateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 rounded-xl"
                aria-label="Tutup modal"
              >
                <X />
              </button>
            </div>

            <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Settings Form */}
              <form onSubmit={handleSaveCertificate} className="space-y-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Type size={12} /> Judul Utama
                    </label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-6 py-4 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                      value={certForm.title_text}
                      onChange={e => setCertForm({...certForm, title_text: e.target.value})}
                      placeholder="Contoh: Sertifikat Kelulusan"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Teks Pernyataan</label>
                    <textarea 
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-6 py-4 rounded-[1.5rem] text-sm font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 h-24 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none" 
                      value={certForm.description_text}
                      onChange={e => setCertForm({...certForm, description_text: e.target.value})}
                      placeholder="Contoh: Dengan ini menyatakan bahwa"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Warna Utama</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" 
                          value={certForm.primary_color}
                          onChange={e => setCertForm({...certForm, primary_color: e.target.value})}
                        />
                        <div className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 rounded-xl text-xs font-mono font-bold text-gray-500 dark:text-slate-300">
                          {certForm.primary_color.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Penanda Tangan</label>
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-6 py-4 rounded-[1.5rem] text-sm font-bold text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-[6px] focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                        value={certForm.signature_name}
                        onChange={e => setCertForm({...certForm, signature_name: e.target.value})}
                        placeholder="Contoh: Nama Lengkap Anda"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Palette size={12} /> Template Background (Optional)
                    </label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        id="cert-bg-upload"
                        className="hidden"
                        onChange={(e) => setSelectedCertFile(e.target.files?.[0] || null)}
                      />
                      <label 
                        htmlFor="cert-bg-upload"
                        className={`flex items-center gap-4 w-full px-8 py-6 bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem] cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-300 dark:hover:border-amber-700 transition-all ${selectedCertFile ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40' : ''}`}
                      >
                        <div className={`p-3 rounded-2xl ${selectedCertFile ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-700 text-gray-400 dark:text-slate-300 shadow-sm'}`}>
                          <Upload size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 dark:text-slate-100 truncate">
                            {selectedCertFile ? selectedCertFile.name : (certForm.template_url ? 'Ganti Template Gambar' : 'Upload Template Gambar')}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Rekomendasi: 2000x1414px (A4 Landscape)</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    isLoading={loading || uploadingCert}
                    className="flex-1 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-blue-500/20"
                  >
                    Simpan Desain Sertifikat
                  </Button>
                </div>
              </form>

              {/* Preview Area */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Eye size={12} /> Live Preview (Tampilan Siswa)
                </label>
                
                <div className="sticky top-32">
                  <div className="aspect-[1.414/1] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative group/cert">
                    {/* Background Template */}
                    {selectedCertFile || certForm.template_url ? (
                      <img 
                        src={selectedCertFile ? URL.createObjectURL(selectedCertFile) : (mounted ? `${certForm.template_url}?t=${Date.now()}` : certForm.template_url)} 
                        className="absolute inset-0 w-full h-full object-cover opacity-100"
                        alt="Background"
                      />
                    ) : (
                      <div className="absolute inset-0 border-[20px]" style={{ borderColor: certForm.primary_color + '20' }}>
                        <div className="absolute inset-[15px] border-2 border-dashed" style={{ borderColor: certForm.primary_color + '40' }} />
                      </div>
                    )}

                    {/* Content Layers */}
                    <div className="relative h-full flex flex-col items-center justify-center p-12 text-center">
                      <div className="mb-8" style={{ color: certForm.primary_color }}>
                        <Award size={80} strokeWidth={1.5} />
                      </div>
                      
                      <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase" style={{ color: certForm.primary_color }}>
                        {certForm.title_text}
                      </h2>
                      
                      <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-8">
                        {certForm.description_text}
                      </p>
                      
                      <div className="w-full max-w-md border-b-2 border-gray-200 pb-2 mb-4">
                        <span className="text-4xl font-serif italic text-gray-900">Nama Siswa</span>
                      </div>
                      
                      <div className="text-gray-500 text-sm font-medium mb-12 max-w-sm leading-relaxed">
                        Telah berhasil menyelesaikan seluruh kurikulum dan evaluasi pada kursus
                        <span className="block font-black text-gray-800 mt-1">"{selectedCourse?.title}"</span>
                      </div>
                      
                      <div className="mt-auto flex justify-between w-full items-end px-12">
                        <div className="text-left space-y-1">
                          <div className="h-px w-32 bg-gray-200" />
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ID: SS-CERT-888</p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest" suppressHydrationWarning>Tgl: {mounted ? new Date().toLocaleDateString('id-ID') : ''}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-serif italic text-xl text-gray-900 mb-1">{certForm.signature_name || 'Mentor Kami'}</p>
                          <div className="h-px w-48 bg-gray-300 ml-auto mb-2" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mentor Pengajar</p>
                        </div>
                      </div>
                    </div>

                    {/* Overlays for watermark/visual polish */}
                    <div className="absolute top-8 right-8 opacity-10 grayscale">
                       <h1 className="text-4xl font-black rotate-12">SkillSpace</h1>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-start gap-3 border border-transparent dark:border-slate-700/60">
                    <div className="p-2 bg-white dark:bg-slate-700 text-gray-400 dark:text-slate-300 rounded-xl">
                      <Settings size={18} />
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-wide">
                      Catatan: Siswa dapat mengunduh sertifikat ini dalam format PDF secara otomatis setelah menyelesaikan semua materi kursus.
                    </p>
                  </div>
                </div>
              </div>
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
