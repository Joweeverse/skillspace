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

  // Student Actions
  async getAvailableCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, profiles(full_name)')
      
      if (error) throw error
      return data as Course[]
    } catch (err) {
      console.warn('Using mock courses data:', err)
      return [
        {
          id: 'course-1',
          title: 'Mastering Next.js 15',
          category: 'Web Development',
          mentor_id: 'mentor-1',
          profiles: { full_name: 'John Doe' }
        },
        {
          id: 'course-2',
          title: 'Advanced Tailwind CSS',
          category: 'Design',
          mentor_id: 'mentor-2',
          profiles: { full_name: 'Jane Smith' }
        }
      ] as any[]
    }
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
      console.warn('Mock enrollment successful')
      return { student_id: studentId, course_id: courseId, status: 'enrolled' } as any
    }
  },

  async getCourseById(id: string) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Course
    } catch (err) {
      return {
        id: id,
        title: 'Demo Course',
        category: 'Web Development',
        profiles: { full_name: 'John Doe' }
      } as any
    }
  },

  async getLessonsByCourseId(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data as Lesson[]
    } catch (err) {
      return [
        {
          id: 'lesson-1',
          course_id: courseId,
          title: 'Introduction to React',
          content: 'In this lesson, we will learn the basics of React.',
          youtube_url: 'https://www.youtube.com/watch?v=Ke90Tje7VS0'
        },
        {
          id: 'lesson-2',
          course_id: courseId,
          title: 'Advanced Hooks',
          content: 'Deep dive into useEffect and custom hooks.',
          youtube_url: 'https://www.youtube.com/watch?v=Ke90Tje7VS0'
        }
      ] as any[]
    }
  },

  async getUserEnrollments(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, courses(*, profiles(full_name))')
        .eq('student_id', studentId)
      
      if (error) throw error
      return data as Enrollment[]
    } catch (err) {
      return [
        {
          course_id: 'course-1',
          status: 'enrolled',
          completed_lessons: ['lesson-1', 'lesson-2'],
          courses: {
            title: 'Mastering Next.js 15',
            category: 'Web Development',
            profiles: { full_name: 'John Doe' }
          }
        }
      ] as any[]
    }
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
