import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createServerClient } from '@supabase/supabase-js'

// Helper untuk inisialisasi Supabase di berbagai layer
export const createClient = () => createClientComponentClient()

// Untuk Service Layer (Server Side)
export const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
