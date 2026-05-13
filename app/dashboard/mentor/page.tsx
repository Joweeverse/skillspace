'use client'

import React, { useState } from 'react'
import { CourseService } from '@/services/courseService'
import { QuizService, ManualQuizInput } from '@/services/quizService'
import { Button } from '@/components/ui/Button'

export default function MentorDashboard() {
  // State untuk Course
  const [courseTitle, setCourseTitle] = useState('')
  const [category, setCategory] = useState('')
  const [courseId, setCourseId] = useState<string | null>(null)

  // State untuk Quiz
  const [quizTitle, setQuizTitle] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [questions, setQuestions] = useState<ManualQuizInput['questions']>([
    { question_text: '', options_json: ['', '', '', ''], correct_answer: '' }
  ])

  const handleAddQuestion = () => {
    setQuestions([...questions, { question_text: '', options_json: ['', '', '', ''], correct_answer: '' }])
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions]
    if (field === 'question_text') {
      newQuestions[index].question_text = value
    } else if (field === 'correct_answer') {
      newQuestions[index].correct_answer = value
    }
    setQuestions(newQuestions)
  }

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options_json[oIndex] = value
    setQuestions(newQuestions)
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Hardcoded mentor_id untuk demo, aslinya ambil dari auth session
      const res = await CourseService.createCourse({
        title: courseTitle,
        category: category,
        mentor_id: '00000000-0000-0000-0000-000000000000' 
      })
      setCourseId(res.id)
      alert('Kursus berhasil dibuat!')
    } catch (err) {
      console.error(err)
      alert('Gagal membuat kursus')
    }
  }

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lessonId) return alert('Pilih Lesson ID terlebih dahulu')
    
    try {
      await QuizService.createManualQuiz({
        lesson_id: lessonId,
        title: quizTitle,
        questions: questions
      })
      alert('Kuis berhasil dibuat!')
    } catch (err) {
      console.error(err)
      alert('Gagal membuat kuis')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>

      {/* Form Buat Kursus */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">1. Buat Kursus Baru</h2>
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Judul Kursus</label>
            <input 
              type="text" 
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Contoh: Mastering Next.js 14"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Kategori</label>
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Contoh: Web Development"
              required
            />
          </div>
          <Button type="submit">Simpan Kursus</Button>
        </form>
      </section>

      {/* Form Buat Kuis Dinamis */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">2. Buat Kuis Manual</h2>
        <form onSubmit={handleCreateQuiz} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lesson ID</label>
              <input 
                type="text" 
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Masukkan UUID Pelajaran"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Judul Kuis</label>
              <input 
                type="text" 
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Contoh: Kuis Modul 1"
                required
              />
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-lg font-medium border-b pb-2">Pertanyaan</h3>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600">Pertanyaan #{qIndex + 1}</span>
                </div>
                
                <input 
                  type="text"
                  placeholder="Ketik pertanyaan di sini..."
                  value={q.question_text}
                  onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((label, oIndex) => (
                    <div key={label} className="flex items-center space-x-2">
                      <span className="font-bold text-gray-500">{label}.</span>
                      <input 
                        type="text"
                        placeholder={`Opsi ${label}`}
                        value={q.options_json[oIndex]}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                        required
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jawaban Benar</label>
                  <select 
                    value={q.correct_answer}
                    onChange={(e) => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                    required
                  >
                    <option value="">Pilih Jawaban Benar</option>
                    {q.options_json.map((opt, i) => (
                      <option key={i} value={opt}>{`Opsi ${['A', 'B', 'C', 'D'][i]}: ${opt}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={handleAddQuestion}>
              + Tambah Pertanyaan
            </Button>
            <Button type="submit">
              Publikasikan Kuis
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
