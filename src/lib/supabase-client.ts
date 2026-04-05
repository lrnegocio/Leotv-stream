import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO MASTER LÉO TV v56.0
 * Conexão direta e blindada para Deploy na Vercel.
 * Projeto: veilblctswnnyzidirrf
 */
const supabaseUrl = 'https://veilblctswnnyzidirrf.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_OCkZfnj39jlsA7vwFukuEA_QV3xHRU-'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  }
});
