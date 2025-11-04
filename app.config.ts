import type { ExpoConfig } from 'expo/config';

// Use a typed app config so we can inject env safely without committing secrets.
// We map EXPO_PUBLIC_OPENAI_API_KEY into expo.extra.OPENAI_API_KEY for runtime fallback.
export default (): ExpoConfig => ({
  name: 'RecoveryGo',
  slug: 'RecoveryGo',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'recoverygo',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // Fallback path used by Plans.tsx if process.env is not present at runtime
    OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  },
});

