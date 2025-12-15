import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseServerInstance: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (supabaseServerInstance) {
    return supabaseServerInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseServerInstance = createClient(supabaseUrl, supabaseKey)
  return supabaseServerInstance
}

// For backwards compatibility - lazy initialization
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabaseServer()[prop as keyof SupabaseClient]
  }
})
