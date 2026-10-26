import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button, Field, Lede, Notice, Screen, Text, Title } from '@/components/ui';
import { useAuth, type OAuthProvider } from '@/providers/auth';
import { makeStyles } from '@/theme';

export default function SignIn() {
  const { session, sendEmailCode, verifyEmailCode, signInWithPassword, signInWithProvider } = useAuth();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  // A code is the default; a password is an option for people who added one.
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
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

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  const provider = (p: OAuthProvider) => attempt(p, () => signInWithProvider(p));
  const sendCode = () => attempt('email', async () => { await sendEmailCode(email.trim()); setStep('code'); });
  const passwordSignIn = () => attempt('password', () => signInWithPassword(email.trim(), password));

  const emailField = (onSubmit: () => void) => (
    <Field
      label="Email"
      value={email}
      onChangeText={setEmail}
      autoCapitalize="none"
      autoComplete="email"
      keyboardType="email-address"
      textContentType="emailAddress"
      placeholder="you@example.com"
      onSubmitEditing={() => emailValid && onSubmit()}
    />
  );

  return (
    <Screen>
      <Title>Start your collection</Title>
      <Lede>Sign in to claim cards. Your collection is the same on the web and in the app.</Lede>

      {step === 'email' ? (
        <>
          {emailField(sendCode)}
          <Button
            label="Email me a sign-in code"
            style={styles.gap}
            disabled={!emailValid}
            loading={busy === 'email'}
            onPress={sendCode}
          />
          <Button
            label="Use a password instead"
            variant="quiet"
            onPress={() => { setStep('password'); setError(null); }}
          />
        </>
      ) : step === 'password' ? (
        <>
          {emailField(() => {})}
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={() => emailValid && password && passwordSignIn()}
          />
          <Button
            label="Sign in"
            style={styles.gap}
            disabled={!emailValid || !password}
            loading={busy === 'password'}
            onPress={passwordSignIn}
          />
          <Button
            label="Email me a code instead"
            variant="quiet"
            onPress={() => { setStep('email'); setPassword(''); setError(null); }}
          />
        </>
      ) : (
        <>
          <Notice text={`We sent a 6-digit code to ${email.trim()}. You can also open the link in that email on this device.`} />
          <Field
            label="Sign-in code"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            placeholder="123456"
          />
          <Button
            label="Sign in"
            style={styles.gap}
            disabled={code.length !== 6}
            loading={busy === 'code'}
            onPress={() => attempt('code', () => verifyEmailCode(email.trim(), code))}
          />
          <Button label="Use a different email" variant="quiet" onPress={() => { setStep('email'); setCode(''); }} />
        </>
      )}

      <View style={styles.divider}>
        <View style={styles.rule} />
        <Text variant="small" tone="muted">or</Text>
        <View style={styles.rule} />
      </View>

      <Button label="Continue with Google" variant="secondary" loading={busy === 'google'} onPress={() => provider('google')} />
      <Button
        label="Continue with Apple"
        variant="secondary"
        style={styles.gapSmall}
        loading={busy === 'apple'}
        onPress={() => provider('apple')}
      />

      {error ? <Notice tone="error" text={error} /> : null}

      {Platform.OS === 'web' ? null : (
        <Text variant="small" tone="muted" style={styles.footnote}>
          Google and Apple sign-in need provider keys set up first. Email works out of the box.
        </Text>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  gap: { marginTop: t.space.md },
  gapSmall: { marginTop: t.space.sm },
  footnote: { marginTop: t.space.lg },
  divider: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm, marginVertical: t.space.lg },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.color.border },
}));
