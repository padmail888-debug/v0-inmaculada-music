import { createClient } from "@supabase/supabase-js"

/**
 * Use this in Client Components ("use client") and in the browser.
 */
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local"
    )
  }

  if (typeof window === "undefined") {
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

