import { createClient } from '@supabase/supabase-js';

/**
 * ISOLAMENTO TOTAL MESTRE LÉO - VERSÃO 253.0
 * Forçamos os dados do NOVO PROJETO diretamente aqui para garantir que
 * nenhum resquício do projeto antigo (que sumiu) interfira na rede.
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
