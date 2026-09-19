import axios, { AxiosError } from 'axios';

/**
 * Runtime configuration.
 *
 * The backend URL is never baked into the bundle. `public/config.js` sets
 * window.__APP_CONFIG__ and the container entrypoint rewrites that file from the
 * API_BASE_URL environment variable, so one image runs unchanged on localhost,
 * an EC2 instance or inside Kubernetes.
 */
declare global {
  interface Window {
    __APP_CONFIG__?: { API_BASE_URL?: string };
  }
}

export function apiBaseUrl(): string {
  const configured = window.__APP_CONFIG__?.API_BASE_URL;
  if (configured && configured.trim().length > 0) {
    return configured.replace(/\/+$/, '');
  }
  // Same-origin fallback: useful when Nginx proxies /api to the backend.
  return `${window.location.origin}/api/v1`;
}

export const TOKEN_KEY = 'careerhub.token';

export const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.baseURL = apiBaseUrl();
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

/** Lets the auth context clear its state when the backend rejects the token. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      localStorage.removeItem(TOKEN_KEY);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

interface ApiErrorBody {
  message?: string;
  fieldErrors?: Record<string, string>;
}

/** Turns any thrown value into a message that is safe to show a user. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (data?.fieldErrors) {
      const first = Object.values(data.fieldErrors)[0];
      if (first) return first;
    }
    if (data?.message) return data.message;
    if (!error.response) return 'Cannot reach the server. Check that the backend is running.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
