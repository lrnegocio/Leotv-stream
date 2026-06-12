
import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO MASTER LÉO TV v385-S (RECONEXÃO AUTOMÁTICA)
 * Este é o coração da rede. Não altere estas chaves.
 */
const supabaseUrl = 'https://veilblctswnnyzidirrf.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_OCkZfnj39jlsA7vwFukuEA_QV3xHRU-'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});
