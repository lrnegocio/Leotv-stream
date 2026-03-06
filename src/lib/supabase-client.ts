
import { createClient } from '@supabase/supabase-js';

/**
 * ATENÇÃO MESTRE LÉO:
 * Coloque aqui a URL e a CHAVE do seu projeto Supabase.
 * Encontre em: Settings -> API no painel do Supabase.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUA_URL_DO_SUPABASE_AQUI';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'SUA_ANON_KEY_DO_SUPABASE_AQUI';

// Inicialização segura: se a URL for o placeholder ou vazia, retorna null
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http') && !supabaseUrl.includes('SUA_URL')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
