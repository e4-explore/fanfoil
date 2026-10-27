import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { BackButton, Button, Field, Lede, Notice, Screen, Text, Title } from '@/components/ui';
import { hasPassword, MIN_PASSWORD_LENGTH, nextStep, useAuth } from '@/providers/auth';
import { makeStyles } from '@/theme';

// Two ways in:
//   prompt  right after a first email-code sign-in (from the index route); skippable
//   manage  from the Profile tab, to add or change a password later
export default function PasswordScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const prompting = mode !== 'manage';
  const { session, profile, setPassword, dismissPasswordPrompt } = useAuth();
  const [password, setPasswordText] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState<'save' | 'skip' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const styles = useStyles();

  if (!session) return <Redirect href="/sign-in" />;

  const changing = hasPassword(session);
  const long = password.length >= MIN_PASSWORD_LENGTH;

  // Go straight to the next step rather than back through the index route,
  // which could still see the pre-update session and show this prompt again.
  const continueOn = () => router.replace(profile ? nextStep(profile) : '/onboarding/league');

  const run = async (key: 'save' | 'skip', fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That didn’t save. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    run('save', async () => {
      await setPassword(password);
      if (prompting) {
        continueOn();
      } else {
        setSaved(true);
        setPasswordText('');
      }
    });

  const skip = () =>
    run('skip', async () => {
      await dismissPasswordPrompt();
      continueOn();
    });

  return (
    <Screen
      footer={
        <>
          <Button
            label="Save password"
            disabled={!long}
            loading={busy === 'save'}
            onPress={save}
          />
          {prompting ? (
            <Button label="Skip for now" variant="minimal" loading={busy === 'skip'} onPress={skip} />
          ) : null}
        </>
      }
    >
      {prompting ? null : (
        <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
      )}
      <Title>{changing ? 'Change your password' : 'Add a password?'}</Title>
      <Lede>
        {prompting
          ? 'Optional. A password lets you sign in without waiting for a code. You can always use a code instead, and add one later from your profile.'
          : 'You can still sign in with a code any time.'}
      </Lede>

      {saved ? <Notice text="Password saved. Use it with your email next time you sign in." /> : null}

      <Field
        label={changing ? 'New password' : 'Password'}
        value={password}
        onChangeText={(t) => {
          setPasswordText(t);
          setSaved(false);
        }}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={() => long && save()}
      />
      <Text variant="small" tone="muted" style={styles.hint}>{`At least ${MIN_PASSWORD_LENGTH} characters.`}</Text>
      <Button
        label={visible ? 'Hide password' : 'Show password'}
        variant="quiet"
        inline
        onPress={() => setVisible((v) => !v)}
      />

      {error ? <Notice tone="error" text={error} /> : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  hint: { marginTop: t.space.xs },
}));
