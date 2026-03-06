import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin Authentication (Email/Senha)
export const adminLogin = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export const adminRegister = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export const adminLogout = async () => {
  return await supabase.auth.signOut()
}

// User Authentication (PIN)
export const validateUserPin = async (pin: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('pin', pin)
    .eq('is_blocked', false)
    .single()
  
  if (error) return { data: null, error }
  
  // Check expiry
  if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
    return { data: null, error: new Error('PIN expirado') }
  }
  
  return { data, error: null }
}

export const generateUserPin = async (tier: string, hours?: number) => {
  const pin = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  let expiryDate = null
  if (tier === 'test' && hours) {
    expiryDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
  } else if (tier === 'monthly') {
    expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      pin,
      subscription_tier: tier,
      expiry_date: expiryDate,
      role: 'user',
      is_blocked: false,
      max_screens: 1
    })
    .select()
    .single()
  
  return { data, error }
}

export const getAllUsers = async () => {
  const { data, error } = await supabase.from('users').select('*')
  return { data, error }
}

export const blockUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_blocked: true })
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

export const unblockUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_blocked: false })
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
  
  return { error }
}
