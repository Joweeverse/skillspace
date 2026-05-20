'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Quiz, Question } from '@/types/database'
import { QuizService } from '@/services/quizService'
import { AuthService } from '@/services/authService'
import { HelpCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, Sparkles } from 'lucide-react'

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
    } catch (err: any) {
      console.error('Failed to mark lesson as completed:', {
        message: err?.message || 'No message',
        details: err?.details || 'No details',
        hint: err?.hint || 'No hint',
        code: err?.code || 'No code',
        fullError: err
      })
    }
  }

  if (loading) return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-semibold text-gray-600">Menyiapkan Kuis...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <HelpCircle size={40} className="text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h3>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button onClick={onClose} variant="outline" className="w-full">Tutup</Button>
      </div>
    </div>
  )

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Kuis Pemahaman</h2>
              <div className="text-xs text-blue-100 opacity-80 uppercase tracking-wider font-semibold">Uji pemahaman materi Anda</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-8">
          {!isSubmitted ? (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-sm font-bold text-blue-600 tracking-tight">PERTANYAAN {currentQuestionIndex + 1} DARI {questions.length}</span>
                  <div className="flex gap-1">
                    {questions.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentQuestionIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">{currentQuestion?.question_text}</h3>
              </div>

              <div className="grid gap-3 mb-10">
                {currentQuestion?.options_json.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === option
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(currentQuestion.id, option)}
                      className={`group w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                        isSelected
                        ? 'border-blue-600 bg-blue-50/50 text-blue-800 shadow-md shadow-blue-500/10'
                        : 'border-gray-100 bg-gray-50/30 hover:border-gray-300 hover:bg-white text-gray-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-400 group-hover:border-gray-300 group-hover:text-gray-600'
                      }`}>
                        {['A', 'B', 'C', 'D'][idx]}
                      </div>
                      <span className="flex-1 font-medium">{option}</span>
                      {isSelected && <CheckCircle2 size={20} className="text-blue-600 animate-in zoom-in" />}
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  leftIcon={<ChevronLeft size={18} />}
                >
                  Sebelumnya
                </Button>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!selectedAnswers[currentQuestion.id]}
                    variant="primary"
                    className="shadow-blue-500/30"
                  >
                    Selesaikan Kuis
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)} 
                    disabled={!selectedAnswers[currentQuestion.id]}
                    rightIcon={<ChevronRight size={18} />}
                  >
                    Selanjutnya
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="relative inline-block mb-8">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto ring-8 ring-offset-4 ${
                  score >= 50 ? 'bg-emerald-50 ring-emerald-100 text-emerald-600' : 'bg-red-50 ring-red-100 text-red-600'
                }`}>
                  {score >= 50 ? <Trophy size={64} /> : <XCircle size={64} />}
                </div>
                {score >= 50 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-2 rounded-full animate-bounce">
                    <Sparkles size={20} />
                  </div>
                )}
              </div>
              
              <div className={`text-6xl font-black mb-4 tracking-tighter ${score >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                {score}%
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                {score >= 50 ? 'Luar Biasa!' : 'Terus Berusaha!'}
              </h3>
              
              <p className="text-gray-500 max-w-xs mx-auto mb-10 leading-relaxed text-lg">
                {score >= 50 
                  ? 'Selamat! Anda telah menguasai materi ini dengan sangat baik.' 
                  : 'Anda membutuhkan setidaknya 50% untuk lulus. Silakan pelajari kembali materinya.'}
              </p>
              
              <div className="flex gap-3">
                <Button 
                  onClick={onClose} 
                  variant={score >= 50 ? 'success' : 'danger'} 
                  className="w-full py-4 text-lg"
                >
                  {score >= 50 ? 'Lanjutkan Belajar' : 'Tutup & Ulangi Materi'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
