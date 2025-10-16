import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Key (first 4 chars):", supabaseAnonKey?.slice(0, 4) + "...")

export const supabase = createClient(supabaseUrl, supabaseAnonKey)