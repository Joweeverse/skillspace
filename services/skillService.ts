import { supabaseAdmin } from '@/lib/supabase'

export interface Skill {
  id: string;
  name: string;
  description?: string;
}

export const SkillService = {
  async getAllSkills(): Promise<Skill[]> {
    const { data, error } = await supabaseAdmin
      .from('skills')
      .select('*')
    
    if (error) throw error
    return data as Skill[]
  },

  async getSkillById(id: string): Promise<Skill> {
    const { data, error } = await supabaseAdmin
      .from('skills')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Skill
  }
}
