import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// O'zgaruvchi nomlarini .env faylidagiga moslashtiramiz
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Ma'lumotlar borligini tekshirish (faqat rivojlantirish jarayoni uchun)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase URL yoki Anon Key topilmadi! .env faylini tekshiring.");
}

export const supabase = createClient<Database>(
  SUPABASE_URL || '', 
  SUPABASE_ANON_KEY || '', 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);