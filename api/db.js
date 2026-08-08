// api/db.js — Client Supabase partagé par les autres fonctions
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('[db] SUPABASE_URL ou SUPABASE_ANON_KEY manquantes')
  throw new Error('Variables Supabase absentes')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})
