import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createBaseClient } from '@supabase/supabase-js'

// Helper untuk inisialisasi Supabase di Client Side (App Router)
export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (typeof window !== 'undefined') {
    console.log('[Supabase Debug] URL:', url ? 'Loaded' : 'MISSING')
    console.log('[Supabase Debug] Key:', anonKey ? 'Loaded' : 'MISSING')
  }

  if (!url || !anonKey) {
    console.warn('Supabase credentials missing. App is running in offline/demo mode.')
  }
  
  return createBrowserClient(
    url || 'https://placeholder.supabase.co', 
    anonKey || 'placeholder-key'
  )
}

// Untuk Service Layer (Server Side) dengan Service Role
export const supabaseAdmin = createBaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
)
