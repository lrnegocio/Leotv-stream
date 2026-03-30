import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO OFICIAL LÉO TV - NOVO SUPABASE (1 MILHÃO DE CANAIS)
 * URL ATUALIZADA: veilblctswnnyzidirrf.supabase.co
 */
const supabaseUrl = 'https://veilblctswnnyzidirrf.supabase.co'; 

/**
 * MESTRE LÉO: Cole sua "anon public key" aqui embaixo entre as aspas.
 * Pegue ela em: Supabase -> Settings -> API -> anon public key.
 */
const supabaseAnonKey = 'COLE_AQUI_SUA_CHAVE_ANON_DO_NOVO_SUPABASE'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
