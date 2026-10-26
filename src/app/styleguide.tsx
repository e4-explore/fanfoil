import { Redirect } from 'expo-router';

import { StyleGuide } from '@/styleguide/StyleGuide';

// Development only: the living style guide (tokens + every component).
export default function StyleGuideRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <StyleGuide />;
}
