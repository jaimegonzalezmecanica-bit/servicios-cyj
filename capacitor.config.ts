import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.cyj.security',
  appName: 'Servicios Integrales CyJ',
  webDir: 'out',
  server: {
    url: 'https://grad-white-monitors-article.trycloudflare.com',
    allowNavigation: ['*.trycloudflare.com', '*.cyj.cl', 'localhost:*'],
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f4c81',
  },
};

export default config;
