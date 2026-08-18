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

// Em produção estática não existe servidor Next para encaminhar /api/*. A URL
// pública da API é embutida pelo build; o fallback same-origin mantém o
// desenvolvimento local compatível com o proxy que cada ambiente preferir.
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "/api/v1";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _connectionRetryCount?: number;
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
  handler(connectionStatus);

  return () => {
    if (connectionHandler === handler) {
      connectionHandler = null;
    }
  };
}

function notifyConnection(status: ConnectionStatus) {
  if (status !== connectionStatus) {
    connectionStatus = status;
    connectionHandler?.(status);
  }
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function onSessionExpired(handler: () => void) {
  sessionExpiredHandler = handler;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  const method = config.method?.toUpperCase() ?? "GET";
  const readOnly = method === "GET" || method === "HEAD";
  const slowConnection = hasSlowConnection();

  // Writes get more time because a client-side timeout does not prove that the
  // server cancelled the operation. This reduces uncertain/duplicate submits.
  config.timeout = readOnly
    ? slowConnection
      ? 60_000
      : 45_000
    : slowConnection
      ? 90_000
      : 75_000;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function hasSlowConnection() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const connection = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
    }
  ).connection;

  return (
    connection?.saveData === true ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  );
}

apiClient.interceptors.response.use(
  (response) => {
    notifyConnection("online");
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // Recover once from a transient infrastructure failure, but only for
    // idempotent reads. Retrying writes can create duplicate records/actions.
    if (originalRequest && shouldRetryRead(error, originalRequest)) {
      originalRequest._connectionRetryCount =
        (originalRequest._connectionRetryCount ?? 0) + 1;
      await waitBeforeRetry(originalRequest._connectionRetryCount);
      return apiClient(originalRequest);
    }

    // Only expose a connection outage after the safe recovery attempt failed.
    trackConnection(error);

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

function shouldRetryRead(
  error: AxiosError,
  request: RetryableRequestConfig,
) {
  const method = request.method?.toUpperCase() ?? "GET";
  const status = error.response?.status;
  const transientFailure =
    !error.response || status === 502 || status === 503 || status === 504;

  return (
    (method === "GET" || method === "HEAD") &&
    !isAuthEndpoint(request.url) &&
    transientFailure &&
    (request._connectionRetryCount ?? 0) < 1
  );
}

function waitBeforeRetry(attempt: number) {
  const jitter = Math.floor(Math.random() * 250);
  return new Promise((resolve) =>
    setTimeout(resolve, 600 * 2 ** (attempt - 1) + jitter),
  );
}

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
  retryAfterSeconds?: number;
};

// Friendly messages for common API errors.
const serverMessageTranslations: Record<string, string> = {
  "Invalid credentials": "Incorrect email or password.",
  "User is inactive": "This account is disabled. Contact an administrator.",
  "User not found": "User not found.",
  "Email already in use": "An account with this email already exists.",
  "User is already linked to another driver":
    "This account is already linked to another driver.",
  "Trip has no pending border crossing — assign borders to the trip first":
    "No pending border is configured for this trip. Open Edit trip, select the route borders in crossing order, save, and then advance the status.",
  "Cannot change borders after a border crossing has started":
    "The route can no longer be changed because a border crossing has already started. Review the recorded border events or contact an administrator.",
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

export function getRateLimitWaitSeconds(error: unknown): number | null {
  if (!(error instanceof AxiosError) || error.response?.status !== 429) {
    return null;
  }

  const headerValue = error.response.headers["retry-after"];
  const bodyValue = (error.response.data as ApiErrorBody | undefined)
    ?.retryAfterSeconds;
  const seconds = Number(headerValue ?? bodyValue);

  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
}

export type ErrorPresentation = {
  title: string;
  description: string;
  code?: string;
};

/** One user-facing error language for pages, forms and support reports. */
export function getErrorPresentation(error: unknown): ErrorPresentation {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const code = status ? `HTTP ${status}` : error.code;

    if (!error.response) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return {
          title: "No internet connection",
          description:
            "Check Wi-Fi or mobile data. The system will reconnect when your connection returns.",
          code,
        };
      }
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return {
          title: "The connection is taking longer than expected",
          description:
            "Your internet may be slow. Wait a moment and try again; before repeating a saved action, check whether it was completed.",
          code,
        };
      }
      return {
        title: "Unable to reach the server",
        description:
          "Check your connection and try again. If other pages also fail, contact the system administrator.",
        code,
      };
    }

    if (status === 401) {
      return {
        title: "Your session has expired",
        description: "Sign in again to continue safely.",
        code,
      };
    }
    if (status === 403) {
      return {
        title: "Access not permitted",
        description:
          "Your account does not have permission for this area. Contact an administrator if you need access.",
        code,
      };
    }
    if (status === 404) {
      return {
        title: "Information not found",
        description:
          "This record may have been removed or changed. Return to the list and refresh it.",
        code,
      };
    }
    if (status === 409) {
      return {
        title: "The information has changed",
        description:
          "Refresh the page, review the latest data and submit the action again.",
        code,
      };
    }
    if (status === 429) {
      const seconds = getRateLimitWaitSeconds(error) ?? 60;
      return {
        title: "Please wait before trying again",
        description: `The system will accept another attempt in approximately ${seconds} seconds.`,
        code,
      };
    }
    if (status && [502, 503, 504].includes(status)) {
      return {
        title: "The service is temporarily unavailable",
        description:
          "The system is reconnecting. Wait a moment and try again; if this continues, report the error code to the administrator.",
        code,
      };
    }
    if (status && status >= 500) {
      return {
        title: "The server could not complete this request",
        description:
          "Try again once. If the problem continues, contact the administrator and provide the error code below.",
        code,
      };
    }

    return {
      title: "The request could not be completed",
      description: extractErrorMessage(error),
      code,
    };
  }

  return {
    title: "Something went wrong",
    description:
      "Try again. If the problem continues, contact the system administrator.",
  };
}

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
    // Framework/class names are useful in server logs, never as user guidance.
    if (/\b(exception|stack|traceback)\b/i.test(raw)) {
      return null;
    }
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

      if (status === 429) {
        const seconds = getRateLimitWaitSeconds(error) ?? 60;
        return `Please wait ${seconds} seconds before trying again.`;
      }

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
      const method = error.config?.method?.toUpperCase();
      if (method && method !== "GET" && method !== "HEAD") {
        return "The connection is slow. Check whether the change was saved before submitting it again.";
      }
      return "We couldn't complete the request right now. Please try again.";
    }

    return "We couldn't complete the request right now. Your connection will recover automatically.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
