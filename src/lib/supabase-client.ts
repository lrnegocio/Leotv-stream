
import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO MASTER LÉO TV v154.0
 * Chaves blindadas para garantir que o Supabase funcione na VPS e Localmente.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://veilblctswnnyzidirrf.supabase.co'; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OCkZfnj39jlsA7vwFukuEA_QV3xHRU-'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  }
});
