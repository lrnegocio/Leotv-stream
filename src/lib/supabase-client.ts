import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO OFICIAL MESTRE LÉO
 * Conexão direta com o Supabase tmyuecvjstrsvnitqdmp
 */
const supabaseUrl = 'https://tmyuecvjstrsvnitqdmp.supabase.co';
const supabaseAnonKey = 'sb_publishable_zLTOvglMQ4zHTpRuFD6Iig_5S1MCChJ';

// Inicialização segura: Só cria o cliente se estivermos no navegador ou se as chaves forem válidas
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
