import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO OFICIAL LÉO TV - SUPABASE
 * Estas chaves permitem que a TV e o PC falem a mesma língua.
 */
const supabaseUrl = 'https://tmyuecvjstrsvnitqdmp.supabase.co';
const supabaseAnonKey = 'sb_publishable_zLTOvglMQ4zHTpRuFD6Iig_5S1MCChJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
