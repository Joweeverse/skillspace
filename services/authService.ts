import { createClient } from '@/lib/supabase'
import { UserRole } from '@/types/database'

export const AuthService = {
  // Initialize client dynamically
  getClient() {
    return createClient()
  },

  async signUp(email: string, password: string, fullName: string, role: UserRole) {
    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await this.getClient().auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (error) throw error
    return data
  },

  async verifySignUp(email: string, token: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await this.getClient().auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: 'signup',
    })

    if (error) throw error
    return data
  },

  async resendVerificationCode(email: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await this.getClient().auth.resend({
      type: 'signup',
      email: normalizedEmail,
    })

    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await this.getClient().auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await this.getClient().auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data: { session }, error } = await this.getClient().auth.getSession()
    if (error) throw error
    return session
  },

  async getCurrentUserProfile() {
    const session = await this.getSession()
    if (!session?.user) return null
    return this.getUserProfile(session.user.id)
  },

  async getUserProfile(userId: string) {
    const { data, error } = await this.getClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }) {
    const { data, error } = await this.getClient()
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updatePassword(newPassword: string) {
    const { data, error } = await this.getClient().auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return data
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${userId}/${fileName}`

    // Ensure we are using the 'profiles' bucket
    const { error: uploadError } = await this.getClient().storage
      .from('profiles')
      .upload(filePath, file, {
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = this.getClient().storage
      .from('profiles')
      .getPublicUrl(filePath)

    return publicUrl
  }
}
