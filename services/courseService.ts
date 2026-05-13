import { supabaseAdmin } from '@/lib/supabase'
import { Course, Lesson, Enrollment } from '@/types/database'

export const CourseService = {
  // Mentor Actions
  async createCourse(course: Omit<Course, 'id' | 'created_at'>) {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert(course)
      .select()
      .single()

    if (error) throw error
    return data as Course
  },

  async addLesson(lesson: Omit<Lesson, 'id'>) {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .insert(lesson)
      .select()
      .single()

    if (error) throw error
    return data as Lesson
  },

  // Student Actions
  async getAvailableCourses() {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*, profiles(full_name)')
    
    if (error) throw error
    return data as Course[]
  },

  async enrollCourse(studentId: string, courseId: string) {
    const { data, error } = await supabaseAdmin
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
  },

  async getCourseById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*, profiles(full_name)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Course
  },

  async getLessonsByCourseId(courseId: string) {
    const { data, error } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data as Lesson[]
  },

  async getUserEnrollments(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select('*, courses(*, profiles(full_name))')
      .eq('student_id', studentId)
    
    if (error) throw error
    return data as Enrollment[]
  },

  async uploadMaterial(file: File, path: string) {
    const { data, error } = await supabaseAdmin.storage
      .from('course-materials')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    
    // Dapatkan Public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('course-materials')
      .getPublicUrl(data.path)

    return publicUrl
  }
}
