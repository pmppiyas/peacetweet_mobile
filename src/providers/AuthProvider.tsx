import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { authApi } from '@/features/auth/api/auth.api';
import { queryCache } from '@/lib/cache/queryCache';
import { tokenStorage, sessionStorage } from '@/lib/storage/secureStorage';
import { LoginInput, RegisterInput, User } from '@/types/user.types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const setUser = (nextUser: User | null) => {
    if (nextUser) {
      sessionStorage.setUser(nextUser);
      setUserState(nextUser);
    } else {
      sessionStorage.clearUser();
      setUserState(null);
    }
  };

  const refreshUser = async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) return;
    try {
      const res = await authApi.getMe();
      const userData = (res as any)?.data || res;
      if (userData?.id) {
        setUser(userData);
      }
    } catch {}
  };

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    const cachedUser = sessionStorage.getUser();
    if (token && cachedUser) {
      setUserState(cachedUser);
    }
    setIsLoading(false);

    if (token) {
      refreshUser();
    }
  }, []);

  const login = async (input: LoginInput) => {
    setIsLoggingIn(true);
    try {
      const response = await authApi.login(input);
      const payload = (response as any)?.data || response;
      const { user: loggedInUser, accessToken, refreshToken } = payload;

      if (accessToken) tokenStorage.setAccessToken(accessToken);
      if (refreshToken) tokenStorage.setRefreshToken(refreshToken);
      if (loggedInUser) setUser(loggedInUser);

      router.replace('/');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (input: RegisterInput) => {
    setIsRegistering(true);
    try {
      const response = await authApi.register(input);
      const payload = (response as any)?.data || response;
      const { user: registeredUser, accessToken, refreshToken } = payload;

      if (accessToken) tokenStorage.setAccessToken(accessToken);
      if (refreshToken) tokenStorage.setRefreshToken(refreshToken);
      if (registeredUser) setUser(registeredUser);

      router.replace('/');
    } finally {
      setIsRegistering(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    tokenStorage.clearTokens();
    sessionStorage.clearUser();
    queryCache.clearAll();
    setUserState(null);
    router.replace('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        isLoggingIn,
        isRegistering,
        login,
        register,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
