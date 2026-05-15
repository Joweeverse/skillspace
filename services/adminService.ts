import { createClient } from '@/lib/supabase'
import { Profile } from '@/types/database'

const supabase = createClient()

export const AdminService = {
  async getUnverifiedMentors() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'mentor')
        .eq('is_verified', false)

      if (error) throw error
      return data as Profile[]
    } catch (err) {
      console.warn('Using mock mentors data:', err)
      return [
        { id: 'm1', full_name: 'Dr. Ahmad (Pending)', role: 'mentor', is_verified: false, updated_at: new Date().toISOString() },
        { id: 'm2', full_name: 'Siti Aminah (Pending)', role: 'mentor', is_verified: false, updated_at: new Date().toISOString() }
      ] as any[]
    }
  },

  async verifyMentor(mentorId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', mentorId)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  }
}
