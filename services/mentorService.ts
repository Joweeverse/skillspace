import { createClient } from '@/lib/supabase'
import { Profile, Portfolio } from '@/types/database'

const supabase = createClient()

/** Safe subset of Profile exposed by the leaderboard — no email or private fields. */
export interface TopMentor {
  id: string
  full_name: string
  avatar_url: string | null
  points: number
}

export const MentorService = {
  /**
   * Fetch the top N mentors ranked by points descending.
   * Only selects id, full_name, avatar_url, and points — never email or private fields.
   */
  async getTopMentors(limit = 5): Promise<TopMentor[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, points')
      .eq('role', 'mentor')
      .order('points', { ascending: false })
      .order('full_name', { ascending: true })
      .limit(limit)

    if (error) throw error
    return (data ?? []) as TopMentor[]
  },

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
  },

  /**
   * Upload a portfolio image to Supabase Storage.
   * Validates type (jpeg/png/webp) and size (max 2 MB).
   * Uploads to portfolio-images/{userId}/{uuid}.{ext}.
   * Best-effort deletes the previous image when replaced.
   * Returns the public URL of the new image.
   */
  async uploadPortfolioImage(
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
      .from('portfolio-images')
      .upload(path, file, { upsert: false, contentType: file.type })

    if (error) throw error

    const { data } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(path)

    // Best-effort: delete previous image if stored in portfolio-images
    if (previousUrl?.includes('/portfolio-images/')) {
      const prevPath = previousUrl.split('/portfolio-images/')[1]?.split('?')[0]
      if (prevPath) {
        supabase.storage.from('portfolio-images').remove([prevPath]).catch(() => {})
      }
    }

    return data.publicUrl
  },

  /**
   * Delete a portfolio image from storage (best-effort, ignores failures).
   */
  async deletePortfolioImage(imageUrl: string): Promise<void> {
    if (!imageUrl?.includes('/portfolio-images/')) return
    const path = imageUrl.split('/portfolio-images/')[1]?.split('?')[0]
    if (path) {
      supabase.storage.from('portfolio-images').remove([path]).catch(() => {})
    }
  }
}
