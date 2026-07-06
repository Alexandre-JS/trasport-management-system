export const AUTH_TOKEN_KEY = "access-token-in-memory";
export const REFRESH_TOKEN_KEY = "sgrtc_refresh_token";

export {
  clearAuthSession as clearAuthTokens,
  getAccessToken as getAuthToken,
  getRefreshToken,
  setAccessToken as setAuthToken,
  setRefreshToken,
} from "@/src/shared/utils/auth-session";
