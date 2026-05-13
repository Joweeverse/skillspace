import { supabaseAdmin } from '@/lib/supabase'
import { Discussion } from '@/types/database'

export const DiscussionService = {
  async getDiscussionsByLesson(lessonId: string) {
    const { data, error } = await supabaseAdmin
      .from('discussions')
      .select('*, profiles(full_name, role)')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data as Discussion[]
  },

  async postMessage(lessonId: string, userId: string, message: string) {
    const { data, error } = await supabaseAdmin
      .from('discussions')
      .insert({
        lesson_id: lessonId,
        user_id: userId,
        message: message
      })
      .select('*, profiles(full_name, role)')
      .single()

    if (error) throw error
    return data as Discussion
  }
}
