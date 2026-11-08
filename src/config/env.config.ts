/**
 * Central Environment Configuration & Validation for PeaceTweet Mobile
 *
 * All environment variables should be read and validated here first,
 * then imported throughout the application.
 */

export interface EnvConfig {
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  backendUrl: string;
  socketUrl: string;
  googleClientId: string;
  googleRedirectUri?: string;
}

function validateAndLoadEnv(): EnvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim() || '';
  const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || '';
  const googleClientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';
  const googleRedirectUri =
    process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();

  // Validate presence of critical variables during development
  if (__DEV__) {
    const missingKeys: string[] = [];
    if (!backendUrl) missingKeys.push('EXPO_PUBLIC_BACKEND_URL');
    if (!googleClientId) missingKeys.push('EXPO_PUBLIC_GOOGLE_CLIENT_ID');

    if (missingKeys.length > 0) {
      console.warn(
        `[EnvConfig Warning] The following environment variables are missing in your .env:\n` +
          missingKeys.map((k) => `  - ${k}`).join('\n') +
          `\nNote: If you recently added these to .env, restart Metro with: npx expo start -c`
      );
    }
  }

  return {
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    backendUrl,
    socketUrl,
    googleClientId,
    googleRedirectUri,
  };
}

export const envConfig: EnvConfig = validateAndLoadEnv();

/**
 * Validates and returns the Google Client ID.
 * Throws a descriptive error if missing.
 */
export function getValidatedGoogleClientId(): string {
  const clientId = envConfig.googleClientId;
  if (!clientId) {
    const errorMsg =
      'Google Client ID is missing. Please configure EXPO_PUBLIC_GOOGLE_CLIENT_ID in your .env and restart Expo with: npx expo start -c';
    if (__DEV__) {
      console.error(`[EnvConfig Error] ${errorMsg}`);
    }
    throw new Error(errorMsg);
  }
  return clientId;
}

/**
 * Validates and returns the Primary Backend URL.
 * Throws a descriptive error if missing.
 */
export function getValidatedBackendUrl(): string {
  const url = envConfig.backendUrl;
  if (!url) {
    const errorMsg =
      'Backend URL is missing. Please configure EXPO_PUBLIC_BACKEND_URL in your .env and restart Expo with: npx expo start -c';
    if (__DEV__) {
      console.error(`[EnvConfig Error] ${errorMsg}`);
    }
    throw new Error(errorMsg);
  }
  return url;
}
