import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.congviecpro.app',
  appName: 'CongViecPro',
  webDir: 'dist',
  server: {
    // Uncomment the line below if you want to load from a remote URL during development
    // url: 'http://YOUR_LOCAL_IP:8080',
    // cleartext: true
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0C0D0F',
    // buildOptions: {
    //   keystorePath: undefined,
    //   keystorePassword: undefined,
    //   keystoreAlias: undefined,
    //   keystoreAliasPassword: undefined,
    // }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0C0D0F',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0C0D0F',
    },
  },
};

export default config;
