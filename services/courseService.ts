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
      .select('*, profiles!courses_mentor_id_fkey(full_name, points, avatar_url), lessons(id)')
    
    if (error) {
      console.error('Supabase error in getAvailableCourses:', error)
      throw error
    }
    
    return data as any[]
  },

  async getCoursePreviewData(courseId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        profiles!courses_mentor_id_fkey(full_name, points, bio, avatar_url),
        lessons(id, title)
      `)
      .eq('id', courseId)
      .single()
    
    if (error) throw error
    return data as any
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
      .select('*, profiles!courses_mentor_id_fkey(full_name, points, avatar_url), lessons(id)')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error in getCourseById:', error)
      throw error
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
            full_name,
            points
          ),
          lessons (
            id
          )
        )
      `)
      .eq('student_id', studentId)
    
    if (error) {
      console.error('Error in getUserEnrollments:', error)
      throw error
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

  /**
   * Upload a course cover image to Supabase Storage.
   * - Validates type (jpeg/png/webp) and size (max 2 MB).
   * - Uploads to course-covers/{userId}/{uuid}.{ext}
   * - Best-effort deletes the previous cover if it was a Supabase storage URL.
   * - Returns the public URL of the new image.
   */
  async uploadCourseCover(
    userId: string,
    file: File,
    previousUrl?: string
  ): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Hanya file JPEG, PNG, atau WebP yang diizinkan.')
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Ukuran file maksimal 2 MB.')
    }

    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]
    const uuid = crypto.randomUUID()
    const path = `${userId}/${uuid}.${ext}`

    const { error } = await supabase.storage
      .from('course-covers')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (error) throw error

    const { data } = supabase.storage
      .from('course-covers')
      .getPublicUrl(path)

    // Best-effort: delete previous cover if it was stored in course-covers
    if (previousUrl?.includes('/course-covers/')) {
      const prevPath = previousUrl.split('/course-covers/')[1]?.split('?')[0]
      if (prevPath) {
        supabase.storage.from('course-covers').remove([prevPath]).catch(() => {})
      }
    }

    return data.publicUrl
  },

  async uploadMaterial(courseId: string, lessonId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${lessonId}-${Date.now()}.${fileExt}`
    const filePath = `${courseId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath)

    return publicUrl
  }
}
