"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  changePassword as changePasswordRequest,
  login as loginRequest,
  logout as logoutRequest,
  me,
  refresh,
} from "@/src/shared/services/auth.service";
import { onSessionExpired } from "@/src/shared/services/api-client";
import type {
  AuthUser,
  ChangePasswordPayload,
  LoginCredentials,
} from "@/src/shared/types/auth";
import {
  clearAuthSession,
  getRememberPreference,
  getRefreshToken,
  getStoredUser,
  setAuthSession,
} from "@/src/shared/utils/auth-session";

type AuthContextValue = {
  user: AuthUser | null;
  permissions: string[];
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
  dismissSessionExpired: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleSessionExpired = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setSessionExpired(true);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    onSessionExpired(handleSessionExpired);
  }, [handleSessionExpired]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const storedUser = getStoredUser();
      const refreshToken = getRefreshToken();

      if (storedUser && active) {
        setUser(storedUser);
      }

      if (!refreshToken) {
        if (active) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await refresh(refreshToken);
        setAuthSession({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user,
          rememberMe: getRememberPreference(),
        });
        const profile = await me();

        if (active) {
          setUser(profile);
          setIsLoading(false);
        }
      } catch {
        clearAuthSession();

        if (active) {
          setUser(null);
          setIsLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginRequest({
      email: credentials.email,
      password: credentials.password,
    });

    setAuthSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
      rememberMe: credentials.rememberMe,
    });
    setUser(response.user);
    setSessionExpired(false);

    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuthSession();
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  const refreshSession = useCallback(async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error("Refresh token not available");
    }

    const response = await refresh(refreshToken);
    setAuthSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
      rememberMe: getRememberPreference(),
    });
    setUser(response.user);
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    await changePasswordRequest(payload);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => Boolean(user?.permissions.includes(permission)),
    [user],
  );

  const hasRole = useCallback(
    (roles: string | string[]) => {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      return Boolean(user?.role && allowedRoles.includes(user.role));
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      permissions: user?.permissions ?? [],
      role: user?.role ?? null,
      isAuthenticated: user !== null,
      isLoading,
      sessionExpired,
      login,
      logout,
      refreshSession,
      changePassword,
      hasPermission,
      hasRole,
      dismissSessionExpired: () => setSessionExpired(false),
    }),
    [
      user,
      isLoading,
      sessionExpired,
      login,
      logout,
      refreshSession,
      changePassword,
      hasPermission,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
