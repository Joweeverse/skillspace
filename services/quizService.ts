import { createClient } from '@/lib/supabase'
import { Quiz, Question } from '@/types/database'

const supabase = createClient()

export interface ManualQuizInput {
  lesson_id: string;
  title: string;
  questions: Omit<Question, 'id' | 'quiz_id'>[];
}

export const QuizService = {
  // Mentor Actions: Create Quiz and its Questions
  async getQuizByLessonId(lessonId: string): Promise<{ quiz: Quiz; questions: Question[] } | null> {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (quizError) throw quizError
    if (!quiz) return null

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quiz.id)

    if (questionsError) throw questionsError

    return { quiz: quiz as Quiz, questions: questions as Question[] }
  },

  async createManualQuiz(input: ManualQuizInput): Promise<{ quiz: Quiz; questions: Question[] }> {
    // 1. Create the Quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        lesson_id: input.lesson_id,
        title: input.title
      })
      .select()
      .single()

    if (quizError) throw quizError

    // 2. Create Questions for this Quiz
    const questionsToInsert = input.questions.map(q => ({
      ...q,
      quiz_id: quiz.id
    }))

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select()

    if (questionsError) throw questionsError

    return { quiz: quiz as Quiz, questions: questions as Question[] }
  },

  async updateQuiz(quizId: string, title: string, questions: Omit<Question, 'id' | 'quiz_id'>[]) {
    // 1. Update Quiz Title
    const { error: quizError } = await supabase
      .from('quizzes')
      .update({ title })
      .eq('id', quizId)

    if (quizError) throw quizError

    // 2. Delete existing questions
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId)

    if (deleteError) throw deleteError

    // 3. Insert new questions
    const questionsToInsert = questions.map(q => ({
      ...q,
      quiz_id: quizId
    }))

    const { data: newQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select()

    if (insertError) throw insertError

    return newQuestions
  },

  async deleteQuiz(quizId: string) {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId)

    if (error) throw error
  },

  // Student Actions: Submit Quiz Answers
  async submitQuizAnswers(studentId: string, quizId: string, answers: { question_id: string, selected_option: string }[]) {
    // Di sini biasanya ada logika untuk mengecek jawaban benar/salah
    // Untuk saat ini kita return input untuk validasi struktur
    
    return { success: true, message: "Answers submitted successfully" }
  },

  async markLessonAsCompleted(studentId: string, lessonId: string) {
    // 1. Dapatkan Course ID dari Lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single()

    if (lessonError) throw lessonError

    // 2. Dapatkan Enrollment saat ini
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('completed_lessons')
      .eq('student_id', studentId)
      .eq('course_id', lesson.course_id)
      .single()

    if (enrollError) throw enrollError

    const currentCompleted = enrollment.completed_lessons || []
    
    // 3. Update jika belum ada di list
    if (!currentCompleted.includes(lessonId)) {
      const updatedList = [...currentCompleted, lessonId]
      
      // 4. Hitung total lesson di course ini
      const { count: totalLessons, error: countError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', lesson.course_id)
      
      if (countError) throw countError

      // 5. Tentukan status (jika semua lesson selesai, status jadi completed)
      const isFinished = totalLessons !== null && updatedList.length >= totalLessons
      
      const { error: updateError } = await supabase
        .from('enrollments')
        .update({ 
          completed_lessons: updatedList,
          status: isFinished ? 'completed' : 'enrolled'
        })
        .eq('student_id', studentId)
        .eq('course_id', lesson.course_id)

      if (updateError) throw updateError
    }

    return { success: true }
  }
}
