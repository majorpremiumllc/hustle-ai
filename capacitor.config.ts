import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hustleai.app',
  appName: 'Hustle AI',
  webDir: 'out',
  server: {
    // ── Production ──
    url: 'https://tryhustleai.com/dashboard',
    // ── Development (uncomment for local testing) ──
    // url: 'http://localhost:3000',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0A0A14',
    preferredContentMode: 'mobile',
    scheme: 'Hustle AI',
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0A0A14',
      showSpinner: true,
      spinnerColor: '#6C5CE7',
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A14',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
