
import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO MASTER LÉO TV v213
 * Chaves fixas soldadas no núcleo para garantir sincronização entre Local e VPS.
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
