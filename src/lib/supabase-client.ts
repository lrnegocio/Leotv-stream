import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO OFICIAL LÉO TV - NOVO SUPABASE (1 MILHÃO DE CANAIS)
 * URL: veilblctswnnyzidirrf.supabase.co
 */
const supabaseUrl = 'https://veilblctswnnyzidirrf.supabase.co'; 

/**
 * MESTRE LÉO: Sua chave Anon Public oficial foi inserida.
 */
const supabaseAnonKey = 'sb_publishable_OCkZfnj39jlsA7vwFukuEA_QV3xHRU-'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
