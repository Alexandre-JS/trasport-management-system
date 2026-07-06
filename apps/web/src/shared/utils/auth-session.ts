import type { AuthUser } from "@/src/shared/types/auth";

const REFRESH_TOKEN_COOKIE = "sgrtc_refresh_token";
const USER_STORAGE_KEY = "sgrtc_user";
const REMEMBER_STORAGE_KEY = "sgrtc_remember";
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

let accessToken: string | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getRefreshToken() {
  if (!isBrowser()) {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${REFRESH_TOKEN_COOKIE}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;
}

export function setRefreshToken(token: string, rememberMe: boolean) {
  const maxAge = rememberMe ? `; max-age=${REFRESH_TOKEN_MAX_AGE}` : "";
  document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(
    token,
  )}; path=/; sameSite=lax${maxAge}`;
}

export function clearRefreshToken() {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${REFRESH_TOKEN_COOKIE}=; path=/; max-age=0; sameSite=lax`;
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser, rememberMe: boolean) {
  window.sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  window.sessionStorage.setItem(REMEMBER_STORAGE_KEY, String(rememberMe));
}

export function getRememberPreference() {
  if (!isBrowser()) {
    return false;
  }

  return window.sessionStorage.getItem(REMEMBER_STORAGE_KEY) === "true";
}

export function clearStoredUser() {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(USER_STORAGE_KEY);
  window.sessionStorage.removeItem(REMEMBER_STORAGE_KEY);
}

export function setAuthSession(input: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  rememberMe: boolean;
}) {
  setAccessToken(input.accessToken);
  setRefreshToken(input.refreshToken, input.rememberMe);
  storeUser(input.user, input.rememberMe);
}

export function clearAuthSession() {
  setAccessToken(null);
  clearRefreshToken();
  clearStoredUser();
}

export const authCookieNames = {
  refreshToken: REFRESH_TOKEN_COOKIE,
};
