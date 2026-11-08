import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { useAuth } from '@/providers/AuthProvider';
import { envConfig, getValidatedGoogleClientId } from '@/config/env.config';

WebBrowser.maybeCompleteAuthSession();

/**
 * Safely parse redirect URL parameters from both hash fragments (#) and query strings (?)
 */
export function parseOAuthUrl(urlString: string) {
  let search = '';
  let hash = '';

  const hashIndex = urlString.indexOf('#');
  const queryIndex = urlString.indexOf('?');

  if (hashIndex !== -1) {
    hash = urlString.substring(hashIndex + 1);
  }

  if (queryIndex !== -1) {
    search =
      hashIndex !== -1 && hashIndex > queryIndex
        ? urlString.substring(queryIndex + 1, hashIndex)
        : urlString.substring(queryIndex + 1);
  }

  const parseParams = (str: string): Record<string, string> => {
    const params: Record<string, string> = {};
    if (!str) return params;
    const cleanStr = str.replace(/^[#?]/, '');
    const pairs = cleanStr.split('&');
    for (const pair of pairs) {
      if (!pair) continue;
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }
    return params;
  };

  const hashParams = parseParams(hash);
  const queryParams = parseParams(search);

  return {
    accessToken: hashParams.access_token || queryParams.access_token,
    idToken: hashParams.id_token || queryParams.id_token,
    code: queryParams.code || hashParams.code,
    error: queryParams.error || hashParams.error,
    errorDescription:
      queryParams.error_description || hashParams.error_description,
  };
}

export function useGoogleAuth() {
  const { loginWithGoogle, isGoogleLoggingIn } = useAuth();
  const [isPrompting, setIsPrompting] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const getRedirectUri = useCallback(() => {
    if (envConfig.googleRedirectUri) {
      return envConfig.googleRedirectUri;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/auth/google/callback`;
    }

    return AuthSession.makeRedirectUri({
      scheme: 'peacetweetmobile',
      path: 'auth/google/callback',
    });
  }, []);

  const promptGoogleSignIn = useCallback(async () => {
    setGoogleError(null);
    const clientId = getValidatedGoogleClientId();

    const redirectUri = getRedirectUri();
    const nonce = Crypto.randomUUID();

    setIsPrompting(true);

    try {
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'token id_token',
          scope: 'openid email profile',
          nonce,
          prompt: 'select_account',
        }).toString();

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type === 'success' && result.url) {
        const parsed = parseOAuthUrl(result.url);

        if (parsed.error) {
          const err = parsed.errorDescription || parsed.error;
          setGoogleError(err);
          throw new Error(err);
        }

        if (!parsed.idToken && !parsed.accessToken && !parsed.code) {
          const err = 'No credentials returned from Google.';
          setGoogleError(err);
          throw new Error(err);
        }

        await loginWithGoogle({
          idToken: parsed.idToken,
          accessToken: parsed.accessToken,
          code: parsed.code,
          redirectUri,
        });
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        // User closed or cancelled OAuth flow
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Google sign-in failed.';
      setGoogleError(msg);
      throw err;
    } finally {
      setIsPrompting(false);
    }
  }, [getRedirectUri, loginWithGoogle]);

  return {
    promptGoogleSignIn,
    isLoading: isPrompting || isGoogleLoggingIn,
    googleError,
    setGoogleError,
    redirectUri: getRedirectUri(),
  };
}
