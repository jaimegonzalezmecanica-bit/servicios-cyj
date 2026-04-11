import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.cyj.security',
  appName: 'Servicios Integrales CyJ',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f4c81',
  },
  ios: {
    contentInset: 'automatic',
    allowLinkPreview: false,
    backgroundColor: '#0f4c81',
    // Use WKWebView for best performance on iOS
    scrollEnabled: true,
    // Configure status bar appearance
    overrideUserAgent: 'CyJ-Security-App/1.0',
  },
  plugins: {
    Geolocation: {
      // Request precise location on first use
      // iOS will show the permission dialog automatically
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0f4c81',
      showSpinner: true,
      spinnerColor: '#FFFFFF',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0f4c81',
    },
  },
};

export default config;
