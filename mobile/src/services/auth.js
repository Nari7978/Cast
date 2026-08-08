import { supabase } from '../supabase/config'

export async function loginWithPIN(mobile, pin) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('data->>mobile', mobile.trim())
    .eq('data->>pin', pin.trim())
    .eq('data->>status', 'Active')
    .single()

  if (error || !data) throw new Error('Invalid mobile number or PIN')

  const agent = { id: data.id, _createdAt: data.inserted_at, ...data.data }
  return agent
}
