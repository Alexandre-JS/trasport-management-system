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

// O browser usa sempre a origem da Web. O servidor Next encaminha /api/* para
// API_ORIGIN, permitindo executar o mesmo build em qualquer infraestrutura.
const apiBaseUrl = "/api/v1";

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

export type ConnectionStatus = "online" | "offline" | "server-down";

let connectionStatus: ConnectionStatus = "online";
let connectionHandler: ((status: ConnectionStatus) => void) | null = null;

export function onConnectionStatus(
  handler: (status: ConnectionStatus) => void,
) {
  connectionHandler = handler;
}

function notifyConnection(status: ConnectionStatus) {
  if (status !== connectionStatus) {
    connectionStatus = status;
    connectionHandler?.(status);
  }
}

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
  (response) => {
    notifyConnection("online");
    return response;
  },
  async (error: AxiosError) => {
    trackConnection(error);

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
      // Só terminar a sessão quando o refresh token foi realmente rejeitado.
      // Se o refresh falhou por falta de rede ou servidor em baixo, manter a
      // sessão e propagar o erro de ligação — mostrar "Sessão expirada" aqui
      // seria enganoso e forçaria um logout desnecessário.
      if (isSessionInvalid(refreshError)) {
        clearAuthSession();
        sessionExpiredHandler?.();
      }
      throw refreshError;
    }
  },
);

function trackConnection(error: AxiosError) {
  if (!error.response) {
    const offline =
      typeof navigator !== "undefined" && navigator.onLine === false;
    notifyConnection(offline ? "offline" : "server-down");
    return;
  }

  if ([502, 503, 504].includes(error.response.status)) {
    notifyConnection("server-down");
    return;
  }

  notifyConnection("online");
}

function isSessionInvalid(refreshError: unknown) {
  if (refreshError instanceof AxiosError) {
    const status = refreshError.response?.status;
    return status === 400 || status === 401 || status === 403;
  }

  // Erro não-HTTP: refresh token ausente no storage → sessão inválida.
  return true;
}

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
  message?: string | string[] | { message?: string | string[] };
  error?: string;
};

// Friendly messages for common API errors.
const serverMessageTranslations: Record<string, string> = {
  "Invalid credentials": "Incorrect email or password.",
  "User is inactive": "This account is disabled. Contact an administrator.",
  "User not found": "User not found.",
  "Email already in use": "An account with this email already exists.",
  "User is already linked to another driver":
    "This account is already linked to another driver.",
  "Internal server error":
    "Server error. Try again; if the problem persists, contact an administrator.",
};

const statusMessages: Record<number, string> = {
  400: "Invalid data. Review the fields and try again.",
  401: "Your session has expired. Sign in to continue.",
  403: "You do not have permission to perform this action.",
  404: "The requested record was not found; it may have been removed.",
  409: "This operation conflicts with existing data.",
  422: "Invalid data. Review the fields and try again.",
  429: "Too many attempts. Wait a moment and try again.",
};

function serverMessage(data: ApiErrorBody | undefined): string | null {
  // O filtro da API pode devolver message como string, lista de validações
  // ou objeto aninhado ({ message, error, statusCode }).
  const raw =
    data?.message && typeof data.message === "object" && !Array.isArray(data.message)
      ? data.message.message
      : data?.message;

  if (Array.isArray(raw)) {
    return raw.length > 0 ? raw.join(" · ") : null;
  }

  if (typeof raw === "string" && raw.trim()) {
    return serverMessageTranslations[raw] ?? raw;
  }

  return null;
}

export function extractErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
) {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const message = serverMessage(error.response.data as ApiErrorBody);

      if (status >= 500) {
        // Em erros do servidor a mensagem técnica não ajuda o utilizador.
        if ([502, 503, 504].includes(status)) {
          return "The server is temporarily unavailable. Try again shortly.";
        }
        return (
          serverMessageTranslations["Internal server error"]
        );
      }

      return message ?? statusMessages[status] ?? fallback;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "No internet connection. Check your network and try again.";
    }

    if (error.code === "ECONNABORTED") {
      return "The server took too long to respond. Try again.";
    }

    return "Unable to contact the server. It may be temporarily unavailable; try again shortly.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
