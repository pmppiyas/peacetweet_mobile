import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PROD_BACKEND_URL =
  process.env.EXPO_PUBLIC_PROD_BACKEND_URL ||
  'https://peace-tweet-backend.onrender.com/api/v1';

export function resolvePrimaryApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  if (Platform.OS === 'web') {
    return envUrl || 'http://localhost:5000/api/v1';
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (debuggerHost) {
    const lanIp = debuggerHost.split(':')[0];
    if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
      return `http://${lanIp}:5000/api/v1`;
    }
  }

  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // Android Emulator loopback to host PC
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }

  return 'http://localhost:5000/api/v1';
}

export const API_CONFIG = {
  primaryBaseUrl: resolvePrimaryApiUrl(),
  fallbackBaseUrl: PROD_BACKEND_URL,
  timeout: 15000,
};
