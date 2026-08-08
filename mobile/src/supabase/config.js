import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  'https://dbqbrlcrwvxdbmnvyxzw.supabase.co',
  'sb_publishable_gjpKzSdhYrriGXxwTE4u9A_YqTXHE8R',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
)
