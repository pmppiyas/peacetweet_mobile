import { io, Socket } from 'socket.io-client';
import { resolvePrimaryApiUrl } from '@/config/api';
import { tokenStorage } from '@/lib/storage/secureStorage';
import { envConfig } from '@/config/env.config';

let socket: Socket | null = null;

export function getSocketUrl(): string {
  const envSocket = envConfig.socketUrl;
  if (envSocket) {
    if (!envSocket.includes('localhost') && !envSocket.includes('127.0.0.1')) {
      return envSocket;
    }
    const apiUrl = resolvePrimaryApiUrl();
    const hostMatch = apiUrl.match(/^https?:\/\/([^/:]+)/);
    if (hostMatch && hostMatch[1] && hostMatch[1] !== 'localhost') {
      return envSocket.replace(/localhost|127\.0\.0\.1/, hostMatch[1]);
    }
    return envSocket;
  }
  const apiUrl = resolvePrimaryApiUrl();
  return apiUrl.replace(/\/api\/v1\/?$/, '');
}

export function initAppSocket(): Socket | null {
  const token = tokenStorage.getAccessToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  const socketUrl = getSocketUrl();

  try {
    socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      // Successfully connected to real-time gateway
    });

    socket.on('connect_error', (err) => {
      console.warn('Real-time socket connect notice:', err.message);
    });

    return socket;
  } catch (err: any) {
    console.warn('Failed to initialize socket:', err.message);
    return null;
  }
}

export function getAppSocket(): Socket | null {
  return socket;
}

export function disconnectAppSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
