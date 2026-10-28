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
  refreshProfile: () => Promise<unknown>;
  sendEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  dismissPasswordPrompt: () => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

export const MIN_PASSWORD_LENGTH = 8;

// Email-code users are offered an optional password once, right after signing
// in. These user_metadata flags only steer that prompt; they grant nothing.
export function hasPassword(session: Session | null) {
  return !!session?.user.user_metadata?.password_set;
}

// Where a signed-in person belongs once any sign-in prompts are done.
export function nextStep(profile: Profile) {
  if (!profile.followed_team_id) return '/onboarding/league' as const;
  if (!profile.onboarding_claimed_at) return '/onboarding/claim' as const;
  return '/collection' as const;
}

export function shouldPromptForPassword(session: Session | null) {
  const user = session?.user;
  if (!user?.email || user.app_metadata?.provider !== 'email') return false;
  return !user.user_metadata?.password_set && !user.user_metadata?.password_prompt_dismissed;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Where magic links and OAuth return to:
//   web     http://localhost:8081/auth/callback
//   native  fanfoil://auth/callback (exp://.../--/auth/callback in Expo Go)
const redirectTo = () => Linking.createURL('auth/callback');

// LOCAL TESTING ONLY, REMOVE BEFORE LAUNCH (see verifyEmailCode).
const DEV_TEST_CODE = '000000';

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
    supabase.auth.getSession().then(async ({ data }) => {
      // A stored session can outlive its account (deleted user, reset
      // database). Ask the server; if it says the user is gone, sign out on
      // this device. Network errors keep the session so offline still works.
      if (data.session) {
        const { error } = await supabase.auth.getUser();
        if (error && 'status' in error && (error.status === 401 || error.status === 403)) {
          await supabase.auth.signOut({ scope: 'local' });
          setSession(null);
          setInitializing(false);
          return;
        }
      }
      setSession(data.session);
      setInitializing(false);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Drop the signed-out user's cached data on an actual sign-out only.
      // Clearing on the initial "no session" event would wipe queries that
      // screens are already waiting on (e.g. a card opened by link while
      // signed out), leaving them on a spinner forever.
      if (event === 'SIGNED_OUT') queryClient.clear();
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

  const sendEmailCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo(), shouldCreateUser: true },
    });
    if (error) throw toAppError(error);
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    // LOCAL TESTING ONLY, REMOVE BEFORE LAUNCH: in development builds, 000000
    // stands in for the emailed code (supabase/seeds/dev_test_code.sql).
    if (__DEV__ && code === DEV_TEST_CODE) {
      const { data } = await supabase.rpc('dev_email_code', { p_email: email });
      if (typeof data === 'string') code = data;
    }
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) throw toAppError(error);
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw toAppError(error);
  }, []);

  const setPassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password, data: { password_set: true } });
    if (error) throw toAppError(error);
  }, []);

  const dismissPasswordPrompt = useCallback(async () => {
    const { error } = await supabase.auth.updateUser({ data: { password_prompt_dismissed: true } });
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
      refreshProfile: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
      sendEmailCode,
      verifyEmailCode,
      signInWithPassword,
      setPassword,
      dismissPasswordPrompt,
      signInWithProvider,
      signOut,
    }),
    [session, initializing, queryClient, userId, sendEmailCode, verifyEmailCode, signInWithPassword, setPassword, dismissPasswordPrompt, signInWithProvider, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');

  // Each caller subscribes to the profile itself instead of reading it through
  // context. Context only catches up a tick after a refetch, so a screen
  // mounted right after `await refreshProfile()` (the claim screen, after
  // following a team) saw the old profile and redirected back.
  const userId = ctx.session?.user.id;
  const profile = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.profile(userId!),
    enabled: !!userId,
  });

  return { ...ctx, profile: profile.data as Profile | undefined, profileLoading: profile.isLoading };
}
