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

// Mensagens de negócio frequentes da API (em inglês) → PT.
const serverMessageTranslations: Record<string, string> = {
  "Invalid credentials": "Email ou senha incorretos.",
  "User is inactive": "Esta conta está desativada. Contacte o administrador.",
  "User not found": "Utilizador não encontrado.",
  "Email already in use": "Já existe uma conta com este email.",
  "User is already linked to another driver":
    "Esta conta já está associada a outro motorista.",
  "Internal server error":
    "Erro no servidor. Tente novamente; se persistir, contacte o administrador.",
};

const statusMessages: Record<number, string> = {
  400: "Dados inválidos. Reveja os campos e tente novamente.",
  401: "Sessão expirada. Inicie sessão para continuar.",
  403: "Não tem permissão para executar esta ação.",
  404: "O registo pedido não foi encontrado — pode ter sido removido.",
  409: "A operação entra em conflito com dados existentes.",
  422: "Dados inválidos. Reveja os campos e tente novamente.",
  429: "Demasiadas tentativas seguidas. Aguarde um momento e tente novamente.",
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
  fallback = "Ocorreu um erro inesperado.",
) {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const message = serverMessage(error.response.data as ApiErrorBody);

      if (status >= 500) {
        // Em erros do servidor a mensagem técnica não ajuda o utilizador.
        if ([502, 503, 504].includes(status)) {
          return "O servidor está temporariamente indisponível. Tente novamente em instantes.";
        }
        return (
          serverMessageTranslations["Internal server error"]
        );
      }

      return message ?? statusMessages[status] ?? fallback;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "Sem ligação à internet. Verifique a sua rede e tente novamente.";
    }

    if (error.code === "ECONNABORTED") {
      return "O servidor demorou demasiado a responder. Tente novamente.";
    }

    return "Não foi possível contactar o servidor — pode estar temporariamente indisponível. Tente novamente em instantes.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
