import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO MASTER LÉO TV v370-S
 * Chaves restauradas para garantir que seus canais reapareçam agora.
 * Certifique-se de que estas chaves estão corretas no seu painel Supabase.
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
