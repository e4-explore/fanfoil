import { Redirect } from 'expo-router';

// The sport step is hidden for now (one live sport). Old links land on leagues.
export default function SportRedirect() {
  return <Redirect href="/onboarding/league" />;
}
