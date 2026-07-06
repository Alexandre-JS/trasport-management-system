import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getRememberPreference,
  setAuthSession,
} from "@/src/shared/utils/auth-session";
import type { AuthResponse } from "@/src/shared/types/auth";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000"}/api/v1`;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let refreshInProgress = false;
let pendingRequests: PendingRequest[] = [];
let sessionExpiredHandler: (() => void) | null = null;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function onSessionExpired(handler: () => void) {
  sessionExpiredHandler = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url)
    ) {
      throw error;
    }

    originalRequest._retry = true;

    try {
      const token = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${token}`;

      return apiClient(originalRequest as AxiosRequestConfig);
    } catch (refreshError) {
      clearAuthSession();
      sessionExpiredHandler?.();
      throw refreshError;
    }
  },
);

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("Refresh token not available");
  }

  if (refreshInProgress) {
    return new Promise<string>((resolve, reject) => {
      pendingRequests.push({ resolve, reject });
    });
  }

  refreshInProgress = true;

  try {
    const { data } = await refreshClient.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });
    const rememberMe = getRememberPreference();

    setAuthSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
      rememberMe,
    });
    pendingRequests.forEach((request) => request.resolve(data.accessToken));
    pendingRequests = [];

    return data.accessToken;
  } catch (error) {
    pendingRequests.forEach((request) => request.reject(error));
    pendingRequests = [];
    throw error;
  } finally {
    refreshInProgress = false;
  }
}

function isAuthEndpoint(url?: string) {
  return Boolean(
    url?.includes("/auth/login") ||
      url?.includes("/auth/refresh") ||
      url?.includes("/auth/logout"),
  );
}

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

export function extractErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado.",
) {
  if (error instanceof AxiosError) {
    if (error.response) {
      const data = error.response.data as ApiErrorBody | undefined;
      const message = data?.message;

      if (Array.isArray(message)) {
        return message.join(", ");
      }

      if (typeof message === "string") {
        return message;
      }

      if (error.response.status === 401) {
        return "Sessão expirada. Inicie sessão para continuar.";
      }

      if (error.response.status === 403) {
        return "Não tem permissão para executar esta ação.";
      }

      return data?.error ?? fallback;
    }

    return "Não foi possível contactar o servidor. Verifique a ligação.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
