'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Quiz, Question } from '@/types/database'
import { QuizService } from '@/services/quizService'
import { AuthService } from '@/services/authService'
import { HelpCircle } from 'lucide-react'

interface QuizModalProps {
  lessonId: string
  onClose: () => void
  onComplete: () => void
}

export const QuizModal = ({ lessonId, onClose, onComplete }: QuizModalProps) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await QuizService.getQuizByLessonId(lessonId)
        if (data && data.questions && data.questions.length > 0) {
          setQuestions(data.questions)
        } else {
          setError('Materi ini belum memiliki kuis.')
        }
      } catch (err: any) {
        console.error('Failed to load quiz:', err)
        setError('Gagal memuat kuis. Pastikan Anda memiliki akses.')
      } finally {
        setLoading(false)
      }
    }
    loadQuiz()
  }, [lessonId])

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answer })
  }

  const handleSubmit = async () => {
    if (questions.length === 0) return

    let correctCount = 0
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correctCount++
      }
    })
    
    const finalScore = Math.round((correctCount / questions.length) * 100)
    setScore(finalScore)
    setIsSubmitted(true)

    try {
      const session = await AuthService.getSession()
      if (session?.user && finalScore >= 50) {
        await QuizService.markLessonAsCompleted(session.user.id, lessonId)
        onComplete()
      }
    } catch (err) {
      console.error('Failed to mark lesson as completed:', err)
    }
  }

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl">Memuat kuis...</div>
    </div>
  )

  if (error) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-8 text-center">
        <div className="text-red-500 mb-4">
          <HelpCircle size={48} className="mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={onClose} className="w-full">Tutup</Button>
      </div>
    </div>
  )

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Kuis Pemahaman</h2>
          <button onClick={onClose} className="text-white hover:text-blue-100">✕</button>
        </div>

        <div className="p-8">
          {!isSubmitted ? (
            <>
              <div className="mb-6">
                <div className="text-sm font-semibold text-blue-600 mb-2">PERTANYAAN {currentQuestionIndex + 1} DARI {questions.length}</div>
                <h3 className="text-xl font-bold text-gray-900">{currentQuestion?.question_text}</h3>
              </div>

              <div className="space-y-3 mb-8">
                {currentQuestion?.options_json.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedAnswers[currentQuestion.id] === option
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="font-bold mr-3">{['A', 'B', 'C', 'D'][idx]}.</span>
                    {option}
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="secondary" 
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                >
                  Sebelumnya
                </Button>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button onClick={handleSubmit} disabled={!selectedAnswers[currentQuestion.id]}>
                    Selesaikan Kuis
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} disabled={!selectedAnswers[currentQuestion.id]}>
                    Selanjutnya
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className={`text-6xl font-bold mb-4 ${score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                {score}%
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {score >= 50 ? 'Selamat! Anda Lulus' : 'Coba Lagi Ya!'}
              </h3>
              <p className="text-gray-500 mb-8">
                {score >= 50 
                  ? 'Materi ini telah ditandai sebagai selesai.' 
                  : 'Anda perlu skor minimal 50% untuk menyelesaikan materi ini.'}
              </p>
              <Button onClick={onClose} className="w-full">Tutup</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
