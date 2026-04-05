import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.buzaobuddy.app',
  appName: 'Buzão Buddy',
  webDir: 'out',
  server: {
    // Point to your Vercel deployment so API routes work
    url: process.env.CAPACITOR_SERVER_URL || 'https://buzao-buddy.vercel.app',
    cleartext: false,
  },
  plugins: {
    Geolocation: {
      // iOS location usage descriptions
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#111111',
    },
  },
  ios: {
    scheme: 'Buzão Buddy',
    backgroundColor: '#111111',
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#111111',
    allowMixedContent: false,
  },
};

export default config;
