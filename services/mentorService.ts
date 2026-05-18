import { createClient } from '@/lib/supabase'
import { Profile, Portfolio } from '@/types/database'

const supabase = createClient()

export const MentorService = {
  async getMentorProfile(mentorId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', mentorId)
      .eq('role', 'mentor')
      .single()

    if (error) throw error
    return data as Profile
  },

  async getAllMentors(): Promise<(Profile & { portfolios: Portfolio[] })[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, portfolios(*)')
      .eq('role', 'mentor')
      .order('full_name')

    if (error) throw error
    return data as (Profile & { portfolios: Portfolio[] })[]
  },

  async updateMentorBio(mentorId: string, bio: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ bio })
      .eq('id', mentorId)

    if (error) throw error
  },

  async getMentorPortfolios(mentorId: string): Promise<Portfolio[]> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Portfolio[]
  },

  async addPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('portfolios')
      .insert(portfolio)
      .select()
      .single()

    if (error) throw error
    return data as Portfolio
  },

  async updatePortfolio(id: string, portfolio: Partial<Portfolio>) {
    const { data, error } = await supabase
      .from('portfolios')
      .update(portfolio)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Portfolio
  },

  async deletePortfolio(id: string) {
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
