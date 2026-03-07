import { createClient } from '@supabase/supabase-js';

/**
 * CONEXÃO OFICIAL LÉO TV - SUPABASE
 */
const supabaseUrl = 'https://tmyuecvjstrsvnitqdmp.supabase.co';
const supabaseAnonKey = 'sb_publishable_zLTOvglMQ4zHTpRuFD6Iig_5S1MCChJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
