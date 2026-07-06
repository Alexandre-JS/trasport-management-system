export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  tokenType: 'access' | 'refresh';
}
