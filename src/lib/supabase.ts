import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in (see README).',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // Web uses localStorage by default; native needs a storage adapter.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web, Supabase reads ?code= from the URL after a magic link or OAuth
    // redirect. On native we handle deep links ourselves (see providers/auth).
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

// Pause token refresh while a native app is in the background.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
