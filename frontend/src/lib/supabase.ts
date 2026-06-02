import { createClient } from '@supabase/supabase-js'

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseInstance;
try {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Failed to initialize Supabase client. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.", e);
  supabaseInstance = {
    storage: {
      from: () => ({
        upload: async () => { throw new Error("Supabase is not configured. Please set environment variables on Vercel."); },
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        listBuckets: async () => ({ data: [], error: new Error("Supabase is not configured.") }),
        createBucket: async () => ({ error: new Error("Supabase is not configured.") }),
      })
    }
  } as any;
}

export const supabase = supabaseInstance;

