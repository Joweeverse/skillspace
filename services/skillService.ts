import { createClient } from '@/lib/supabase'

const supabase = createClient()

export interface Skill {
  id: string;
  name: string;
  description?: string;
}

export const SkillService = {
  async getAllSkills(): Promise<Skill[]> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
    
    if (error) throw error
    return data as Skill[]
  },

  async getSkillById(id: string): Promise<Skill> {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Skill
  }
}
