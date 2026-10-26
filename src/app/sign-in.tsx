import { Redirect } from 'expo-router';
import { Fragment, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button, Field, Lede, Notice, Screen, Text, Title } from '@/components/ui';
import { useAuth, type OAuthProvider } from '@/providers/auth';
import { makeStyles } from '@/theme';

// Google and Apple first. "Continue with email" always sends a code and shows
// the same next screen to everyone, so it never reveals whether an account
// exists or has a password. People with a password can switch to it there.
//
// Code and password stay separate fields (not one combined box) so iOS can
// autofill the code from Mail and password managers can fill the password.
export default function SignIn() {
  const { session, sendEmailCode, verifyEmailCode, signInWithPassword, signInWithProvider } = useAuth();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [method, setMethod] = useState<'code' | 'password'>('code');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (session) return <Redirect href="/" />;

  const attempt = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in didn’t work. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const address = email.trim();
  const emailValid = /^\S+@\S+\.\S+$/.test(address);

  const provider = (p: OAuthProvider) => attempt(p, () => signInWithProvider(p));
  const continueWithEmail = () =>
    attempt('email', async () => {
      await sendEmailCode(address);
      setMethod('code');
      setStep('verify');
    });
  const switchMethod = (next: 'code' | 'password') => {
    setMethod(next);
    setError(null);
  };
  const startOver = () => {
    setStep('email');
    setCode('');
    setPassword('');
    setError(null);
  };

  return (
    <Screen>
      <Title>Start your collection</Title>
      <Lede>Sign in to claim cards. Your collection is the same on the web and in the app.</Lede>

      {/* Keyed per view so controls never carry focus/press state across them. */}
      {step === 'email' ? (
        <Fragment key="email">
          <Button
            label="Continue with Google"
            variant="secondary"
            style={styles.first}
            loading={busy === 'google'}
            onPress={() => provider('google')}
          />
          <Button
            label="Continue with Apple"
            variant="secondary"
            style={styles.gapSmall}
            loading={busy === 'apple'}
            onPress={() => provider('apple')}
          />

          <View style={styles.divider}>
            <View style={styles.rule} />
            <Text variant="small" tone="muted">
              or
            </Text>
            <View style={styles.rule} />
          </View>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            onSubmitEditing={() => emailValid && continueWithEmail()}
          />
          <Button
            label="Continue with email"
            variant="secondary"
            style={styles.gap}
            disabled={!emailValid}
            loading={busy === 'email'}
            onPress={continueWithEmail}
          />
        </Fragment>
      ) : method === 'code' ? (
        <Fragment key="code">
          <Notice text={`We sent a 6-digit code to ${address}. You can also open the link in that email on this device.`} />
          <Field
            label="Sign-in code"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            placeholder="123456"
            onSubmitEditing={() => code.length === 6 && attempt('code', () => verifyEmailCode(address, code))}
          />
          <Button
            label="Sign in"
            style={styles.gap}
            disabled={code.length !== 6}
            loading={busy === 'code'}
            onPress={() => attempt('code', () => verifyEmailCode(address, code))}
          />
          <Button label="Use your password instead" variant="quiet" onPress={() => switchMethod('password')} />
          <Button label="Use a different email" variant="quiet" onPress={startOver} />
        </Fragment>
      ) : (
        <Fragment key="password">
          <Notice text={`Signing in as ${address}.`} />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={() => password && attempt('password', () => signInWithPassword(address, password))}
          />
          <Button
            label="Sign in"
            style={styles.gap}
            disabled={!password}
            loading={busy === 'password'}
            onPress={() => attempt('password', () => signInWithPassword(address, password))}
          />
          <Button label="Use the emailed code instead" variant="quiet" onPress={() => switchMethod('code')} />
          <Button label="Use a different email" variant="quiet" onPress={startOver} />
        </Fragment>
      )}

      {error ? <Notice tone="error" text={error} /> : null}

      {step === 'email' && Platform.OS !== 'web' ? (
        <Text variant="small" tone="muted" style={styles.footnote}>
          Google and Apple sign-in need provider keys set up first. Email works out of the box.
        </Text>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  first: { marginTop: t.space.lg },
  gap: { marginTop: t.space.md },
  gapSmall: { marginTop: t.space.sm },
  footnote: { marginTop: t.space.lg },
  // Bottom margin is smaller because the Field below brings its own top margin.
  divider: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm, marginTop: t.space.lg, marginBottom: t.space.sm },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.color.border },
}));
