import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.servicebot.ai',
  appName: 'ServiceBot AI',
  webDir: 'out',
  server: {
    // ── Production ──
    // Set this to your deployed URL when publishing to App Store
    // url: 'https://servicebot.ai',

    // ── Development ──
    // Comment out the line below and uncomment the production URL above for release
    url: 'http://localhost:3000',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0A0A14',
    preferredContentMode: 'mobile',
    scheme: 'ServiceBot AI',
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0A0A14',
      showSpinner: true,
      spinnerColor: '#6C5CE7',
      androidScaleType: 'CENTER_CROP',
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
  },
};

export default config;
