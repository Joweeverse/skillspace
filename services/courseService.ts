import { createClient } from '@/lib/supabase'
import { Course, Lesson, Enrollment } from '@/types/database'

const supabase = createClient()

export const CourseService = {
  // Mentor Actions
  async createCourse(course: Omit<Course, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single()

    if (error) throw error
    return data as Course
  },

  async addLesson(lesson: Omit<Lesson, 'id'>) {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single()

    if (error) throw error
    return data as Lesson
  },

  async updateLesson(id: string, updates: Partial<Lesson>) {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Lesson
  },

  async deleteLesson(id: string) {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async deleteCourse(id: string) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Student Actions
  async getAvailableCourses() {
    // We use an explicit join syntax to ensure Supabase matches the foreign key correctly
    const { data, error } = await supabase
      .from('courses')
      .select('*, profiles!courses_mentor_id_fkey(full_name)')
    
    if (error) {
      console.error('Supabase error in getAvailableCourses:', error)
      // Fallback to simple select if join fails
      const { data: simpleData, error: simpleError } = await supabase
        .from('courses')
        .select('*')
      
      if (simpleError) throw simpleError
      return simpleData as any[]
    }
    
    return data as any[]
  },

  async checkEnrollment(studentId: string, courseId: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle()
    
    if (error) throw error
    return !!data
  },

  async enrollCourse(studentId: string, courseId: string) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          status: 'enrolled',
          completed_lessons: []
        })
        .select()
        .single()

      if (error) throw error
      return data as Enrollment
    } catch (err) {
      console.warn('Mock enrollment failed or already enrolled')
      throw err
    }
  },

  async getCourseById(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*, profiles!courses_mentor_id_fkey(full_name)')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error in getCourseById:', error)
      // Fallback to simple select
      const { data: simpleData, error: simpleError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()
      
      if (simpleError) throw simpleError
      return simpleData as any
    }
    return data as Course
  },

  async getLessonsByCourseId(courseId: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data as Lesson[]
  },

  async getUserEnrollments(studentId: string) {
    // Using a more robust join syntax to ensure we get the course, mentor details, and lesson count
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          *,
          profiles!courses_mentor_id_fkey (
            full_name
          ),
          lessons (
            id
          )
        )
      `)
      .eq('student_id', studentId)
    
    if (error) {
      console.error('Error in getUserEnrollments:', error)
      // Fallback: Try fetching just enrollments and courses without mentor profile
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('enrollments')
        .select('*, courses(*, lessons(id))')
        .eq('student_id', studentId)
      
      if (fallbackError) throw fallbackError
      return fallbackData as any[]
    }
    
    return data as any[]
  },

  async getCoursesByMentorId(mentorId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('mentor_id', mentorId)
    
    if (error) throw error
    return data as Course[]
  },

  async uploadMaterial(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    
    // Dapatkan Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-materials')
      .getPublicUrl(data.path)

    return publicUrl
  }
}
