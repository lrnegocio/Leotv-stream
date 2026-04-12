import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO MASTER LÉO TV v153.0
 * Suporte a Variáveis de Ambiente para Netlify/Vercel.
 * Fallback seguro para chaves hardcoded.
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
