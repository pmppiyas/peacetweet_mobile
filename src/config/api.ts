import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { envConfig } from './env.config';

export function resolvePrimaryApiUrl(): string {
  const configuredUrl = envConfig.backendUrl;

  if (!configuredUrl) {
    if (__DEV__) {
      console.warn(
        '[API Config] EXPO_PUBLIC_BACKEND_URL is not set in your .env file.'
      );
    }
    return '';
  }

  if (
    !configuredUrl.includes('localhost') &&
    !configuredUrl.includes('127.0.0.1')
  ) {
    return configuredUrl;
  }

  // Web browsers access PC localhost directly
  if (Platform.OS === 'web') {
    return configuredUrl;
  }

  // Physical devices via Expo Go connect via host PC's LAN IP
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (debuggerHost) {
    const lanIp = debuggerHost.split(':')[0];
    if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
      return configuredUrl.replace(/localhost|127\.0\.0\.1/, lanIp);
    }
  }

  // Android Emulator loopback to host PC
  if (Platform.OS === 'android') {
    return configuredUrl.replace(/localhost|127\.0\.0\.1/, '10.0.2.2');
  }

  return configuredUrl;
}

export const API_CONFIG = {
  primaryBaseUrl: resolvePrimaryApiUrl(),
  timeout: 30000,
};
