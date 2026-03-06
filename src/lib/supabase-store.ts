import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const generateRandomPin = (length: number = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const createUserWithPin = async (pin: string) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ pin, role: 'user', subscription_tier: 'test', max_screens: 1 }])
    .select()
  
  return { data, error }
}

export const validatePin = async (pin: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('pin', pin)
    .single()
  
  return { data, error }
}

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  return { data, error }
}
