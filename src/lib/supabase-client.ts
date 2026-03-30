import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO OFICIAL LÉO TV - NOVO SUPABASE (1 MILHÃO DE CANAIS)
 * URL ATUALIZADA: veilblctswnnyzidirrf.supabase.co
 */
const supabaseUrl = 'https://veilblctswnnyzidirrf.supabase.co'; 

/**
 * MESTRE LÉO: Chave Anon Public ativada com sucesso.
 */
const supabaseAnonKey = 'sb_publishable_OCkZfnj39jlsA7vwFukuEA_QV3xHRU-'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
