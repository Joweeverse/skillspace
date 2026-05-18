import { createClient } from '@/lib/supabase'
import { Discussion } from '@/types/database'

const supabase = createClient()

export const DiscussionService = {
  async getDiscussions(lessonId: string) {
    const { data, error } = await supabase
      .from('discussions')
      .select('*, profiles!user_id(full_name, role, is_verified)')
      .eq('lesson_id', lessonId)
      .eq('is_private', false)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Discussion[]
  },

  async getPrivateDiscussions(lessonId: string, userId: string) {
    const { data, error } = await supabase
      .from('discussions')
      .select('*, profiles!user_id(full_name, role, is_verified)')
      .eq('lesson_id', lessonId)
      .eq('is_private', true)
      .or(`user_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Discussion[]
  },

  async getMentorPrivateDiscussions(lessonId: string) {
    const { data, error } = await supabase
      .from('discussions')
      .select('*, profiles!user_id(full_name, role, is_verified)')
      .eq('lesson_id', lessonId)
      .eq('is_private', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Discussion[]
  },

  async postMessage(lessonId: string, userId: string, message: string, isPrivate: boolean = false, recipientId?: string) {
    const { data, error } = await supabase
      .from('discussions')
      .insert({
        lesson_id: lessonId,
        user_id: userId,
        message: message,
        is_private: isPrivate,
        recipient_id: recipientId
      })
      .select('*, profiles!user_id(full_name, role, is_verified)')
      .single()

    if (error) throw error
    return data as Discussion
  }
}

