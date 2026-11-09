import { io, Socket } from 'socket.io-client';
import { resolvePrimaryApiUrl } from '@/config/api';
import { tokenStorage } from '@/lib/storage/secureStorage';
import { envConfig } from '@/config/env.config';

let socket: Socket | null = null;
let currentSocketToken: string | null = null;

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
      currentSocketToken = null;
    }
    return null;
  }

  // Reuse existing active socket if token has not changed
  if (socket && currentSocketToken === token) {
    if (socket.disconnected) {
      socket.connect();
    }
    return socket;
  }

  // If token changed or previous socket exists, clean up
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentSocketToken = token;
  const socketUrl = getSocketUrl();

  try {
    socket = io(socketUrl, {
      auth: (cb: (data: Record<string, any>) => void) => {
        // Dynamically fetch the current access token on each connection / reconnection attempt
        const latestToken = tokenStorage.getAccessToken() || '';
        cb({ token: latestToken });
      },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      timeout: 10000,
    });

    socket.on('connect', () => {
      // Connected to real-time gateway
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
  if (socket && socket.disconnected && tokenStorage.getAccessToken()) {
    socket.connect();
  }
  return socket;
}

export function disconnectAppSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    currentSocketToken = null;
  }
}
