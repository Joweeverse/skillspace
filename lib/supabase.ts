import { createBrowserClient } from '@supabase/ssr'
import { createClient as createBaseClient } from '@supabase/supabase-js'

// Helper untuk inisialisasi Supabase di Client Side (App Router)
export const createClient = () => {

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (typeof window !== 'undefined') {
    console.log('[Supabase Client] URL:', url ? `Detected (${url.substring(0, 15)}...)` : 'MISSING')
    console.log('[Supabase Client] Key:', anonKey ? 'Detected' : 'MISSING')
    
    // Check if the URL is a placeholder or invalid
    if (url?.includes('your-project-url')) {
      console.error('[Supabase Client] You are using a placeholder URL! Update .env.local')
    }
  } else {
    // Server-side logging
    console.log('[Supabase Server] URL:', url ? 'Detected' : 'MISSING')
  }

  if (!url || !anonKey || url.includes('placeholder')) {
    const errorMsg = 'Supabase URL or Anon Key is missing or invalid. Check your .env.local file and RESTART your server (npm run dev).'
    console.error(errorMsg)
    throw new Error(errorMsg)
  }
  
  return createBrowserClient(url, anonKey)
}

// Untuk Service Layer (Server Side) dengan Service Role
export const supabaseAdmin = createBaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
)
