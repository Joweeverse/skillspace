import { createClient } from '@/lib/supabase'
import { Discussion } from '@/types/database'

const supabase = createClient()

export const DiscussionService = {
  async getDiscussions(lessonId: string) {
    const { data, error } = await supabase
      .from('discussions')
      .select('*, profiles(full_name, role, is_verified)')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Discussion[]
  },

  async postMessage(lessonId: string, userId: string, message: string) {
    const { data, error } = await supabase
      .from('discussions')
      .insert({
        lesson_id: lessonId,
        user_id: userId,
        message: message
      })
      .select('*, profiles(full_name, role, is_verified)')
      .single()

    if (error) throw error
    return data as Discussion
  }
}

