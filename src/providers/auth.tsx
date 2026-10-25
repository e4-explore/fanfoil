import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'apple';

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
  profile: Profile | undefined;
  profileLoading: boolean;
  refreshProfile: () => Promise<unknown>;
  sendEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Where magic links and OAuth return to:
//   web     http://localhost:8081/auth/callback
//   native  fanfoil://auth/callback (exp://.../--/auth/callback in Expo Go)
const redirectTo = () => Linking.createURL('auth/callback');

async function exchangeFromUrl(url: string) {
  const { queryParams } = Linking.parse(url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : undefined;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw toAppError(error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const queryClient = useQueryClient();
  const incomingUrl = Linking.useURL();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  // Native: a magic link opened the app. (Web handles this in the client.)
  useEffect(() => {
    if (Platform.OS !== 'web' && incomingUrl?.includes('code=')) {
      exchangeFromUrl(incomingUrl).catch(() => {});
    }
  }, [incomingUrl]);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.profile(userId!),
    enabled: !!userId,
  });

  const sendEmailCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo(), shouldCreateUser: true },
    });
    if (error) throw toAppError(error);
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) throw toAppError(error);
  }, []);

  const signInWithProvider = useCallback(async (provider: OAuthProvider) => {
    // iOS: Apple requires the native sheet.
    if (provider === 'apple' && Platform.OS === 'ios') {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw toAppError({ message: 'Apple didn’t return a sign-in token. Try again.' });
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      if (error) throw toAppError(error);
      return;
    }

    // Web: full-page redirect; Supabase finishes the sign-in on return.
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
      if (error) throw toAppError(error);
      return;
    }

    // Android (and Apple on Android): in-app browser, then exchange the code.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo(), skipBrowserRedirect: true },
    });
    if (error || !data.url) throw toAppError(error ?? { message: 'Couldn’t start sign-in.' });
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo());
    if (result.type === 'success') await exchangeFromUrl(result.url);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      initializing,
      profile: profileQuery.data,
      profileLoading: profileQuery.isLoading,
      refreshProfile: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
      sendEmailCode,
      verifyEmailCode,
      signInWithProvider,
      signOut,
    }),
    [session, initializing, profileQuery.data, profileQuery.isLoading, queryClient, userId, sendEmailCode, verifyEmailCode, signInWithProvider, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
