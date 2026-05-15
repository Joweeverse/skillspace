import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createBaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// Helper untuk inisialisasi Supabase di Client Side (App Router)
export const createClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials missing. App is running in offline/demo mode.')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Untuk Service Layer (Server Side) dengan Service Role
export const supabaseAdmin = createBaseClient(supabaseUrl, supabaseServiceKey)
