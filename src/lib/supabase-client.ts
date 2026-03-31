import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO EXCLUSIVA LÉO TV - NOVO PROJETO MASTER
 * URL: veilblctswnnyzidirrf.supabase.co
 */
const supabaseUrl = 'https://veilblctswnnyzidirrf.supabase.co'; 

/**
 * CHAVE PÚBLICA ATUALIZADA
 */
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
