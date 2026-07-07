export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  tokenType: 'access' | 'refresh';
  /** Refresh-token identifier, present only on refresh tokens. */
  jti?: string;
}
