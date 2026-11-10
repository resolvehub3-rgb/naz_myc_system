import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'mcg_supabase_url';
const STORAGE_KEY_ANON_KEY = 'mcg_supabase_anon_key';

export function getSupabaseConfig(): { url: string; anonKey: string; isCustom: boolean } {
  // Check localStorage first (in case configured through church admin UI)
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON_KEY) : null;

  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey, isCustom: true };
  }

  // Fallback to Vite environment variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    isCustom: false
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey.trim());
    // Reinitialize client
    initSupabaseClient();
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON_KEY);
    initSupabaseClient();
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    anonKey.length > 20 &&
    !url.includes('your-project-id')
  );
}

let supabaseInstance: SupabaseClient | null = null;

export function initSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || url.includes('your-project-id')) {
    supabaseInstance = null;
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
    return null;
  }
}

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    initSupabaseClient();
  }
  if (!supabaseInstance) {
    // Return a dummy client or throw descriptive error
    const dummyUrl = 'https://placeholder.supabase.co';
    const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';
    supabaseInstance = createClient(dummyUrl, dummyKey);
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  hasTables?: boolean;
}> {
  const url = customUrl || getSupabaseConfig().url;
  const anonKey = customKey || getSupabaseConfig().anonKey;

  if (!url || !anonKey || url.includes('your-project-id')) {
    return {
      success: false,
      message: 'Supabase URL or Anon Key is missing. Please provide your Supabase project credentials.'
    };
  }

  try {
    const tempClient = createClient(url, anonKey);
    // Attempt a light query on members table
    const { error } = await tempClient.from('members').select('id').limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation "public.members"')) {
        return {
          success: true,
          message: 'Connected to Supabase project, but the church tables have not been created yet. Please execute the SQL migration.',
          hasTables: false
        };
      }
      return {
        success: false,
        message: `Connection error (${error.code || 'UNKNOWN'}): ${error.message}`
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Methodist Church Ghana Supabase database!',
      hasTables: true
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Failed to connect: ${msg}`
    };
  }
}
