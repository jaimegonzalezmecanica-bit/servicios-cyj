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
};

export default config;
