import { API_CONFIG } from '@/config/api';
import { API_ENDPOINTS } from '@/constants/api';
import { tokenStorage, sessionStorage } from '../storage/secureStorage';

export interface ApiClientResponse<T = any> {
  data: T;
  status: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  _retry?: boolean;
}

let activeBaseUrl = API_CONFIG.primaryBaseUrl;

function buildUrl(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${cleanBase}${cleanPath}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        searchParams.append(k, String(v));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

async function rawFetch(
  baseUrl: string,
  method: string,
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<Response> {
  const token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(buildUrl(baseUrl, endpoint, options?.params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function request<T = any>(
  method: string,
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiClientResponse<T>> {
  let response: Response;
  const primaryUrl = API_CONFIG.primaryBaseUrl;

  try {
    response = await rawFetch(primaryUrl, method, endpoint, body, options);
    activeBaseUrl = primaryUrl;
  } catch (networkErr) {
    // If local backend (:5000) is unreachable, try fallback for this request
    if (primaryUrl !== API_CONFIG.fallbackBaseUrl) {
      response = await rawFetch(
        API_CONFIG.fallbackBaseUrl,
        method,
        endpoint,
        body,
        options
      );
      activeBaseUrl = API_CONFIG.fallbackBaseUrl;
    } else {
      throw networkErr;
    }
  }

  let data: any = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  // Handle 401 token refresh
  if (
    response.status === 401 &&
    !options?._retry &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/register') &&
    !endpoint.includes('/auth/refresh')
  ) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await rawFetch(
          activeBaseUrl,
          'POST',
          API_ENDPOINTS.AUTH.REFRESH,
          { refreshToken }
        );
        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          const newAccess =
            refreshJson?.data?.accessToken || refreshJson?.accessToken;
          const newRefresh =
            refreshJson?.data?.refreshToken || refreshJson?.refreshToken;

          if (newAccess) {
            tokenStorage.setAccessToken(newAccess);
            if (newRefresh) {
              tokenStorage.setRefreshToken(newRefresh);
            }
            return request<T>(method, endpoint, body, {
              ...options,
              _retry: true,
            });
          }
        }
      } catch {}
    }

    tokenStorage.clearTokens();
    sessionStorage.clearUser();
  }

  if (!response.ok) {
    const err: any = new Error(
      data?.message || `Request failed with status ${response.status}`
    );
    err.response = {
      status: response.status,
      data,
    };
    throw err;
  }

  return {
    data: data as T,
    status: response.status,
  };
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>('GET', endpoint, undefined, options),
  post: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', endpoint, body, options),
  put: <T = any>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', endpoint, body, options),
  patch: <T = any>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ) => request<T>('PATCH', endpoint, body, options),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request<T>('DELETE', endpoint, undefined, options),
  getActiveBaseUrl: () => activeBaseUrl,
};
