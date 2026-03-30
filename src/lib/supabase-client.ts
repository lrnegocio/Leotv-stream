import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO OFICIAL LÉO TV - NOVO SUPABASE (1 MILHÃO DE CANAIS)
 * Mestre Léo: Cole aqui a URL e a ANON KEY do seu NOVO projeto Supabase.
 * Vá em: Settings -> API -> Project URL / anon public key.
 */
const supabaseUrl = 'https://fxrzyrvnouafqdwrrsfn.supabase.co'; // ATUALIZE AQUI SE MUDAR
const supabaseAnonKey = 'sb_publishable_zLTOvglMQ4zHTpRuFD6Iig_5S1MCChJ'; // COLE AQUI SUA NOVA CHAVE ANON

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
