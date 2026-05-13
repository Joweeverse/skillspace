import { supabaseAdmin } from '@/lib/supabase'
import { Profile } from '@/types/database'

export const AdminService = {
  async getUnverifiedMentors() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'mentor')
      .eq('is_verified', false)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data as Profile[]
  },

  async verifyMentor(mentorId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', mentorId)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  }
}
