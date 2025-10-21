// DEPRECATED: This file is no longer used.
// Please use @/integrations/supabase/client instead.
// This file has been kept for reference only.
//
// The Lovable platform automatically generates the correct Supabase client
// in src/integrations/supabase/client.ts with the proper credentials.

import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please check your .env file and ensure the following variables are set:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY')
  console.error('See .env.example for reference.')

  throw new Error(
    'Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. See .env.example for reference.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
