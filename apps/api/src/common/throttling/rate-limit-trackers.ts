import { createHash } from 'node:crypto';

type RateLimitRequest = {
  body?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  params?: Record<string, unknown>;
};

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function fallbackIp(request: RateLimitRequest): string {
  return `ip:${request.ip ?? 'unknown'}`;
}

export function authenticatedOrIpTracker(request: RateLimitRequest): string {
  const authorization = request.headers?.authorization;
  const value = Array.isArray(authorization) ? authorization[0] : authorization;
  const match = value?.match(/^Bearer\s+(.+)$/i);

  if (match?.[1]) {
    return `session:${digest(match[1])}`;
  }

  // Public tracking requests do not carry a JWT. Keying them by their opaque
  // token prevents users behind the same reverse proxy from blocking others.
  const publicToken = request.params?.token;
  if (typeof publicToken === 'string' && publicToken) {
    return `public:${digest(publicToken)}`;
  }

  return fallbackIp(request);
}

export function loginAccountTracker(request: RateLimitRequest): string {
  const identifier = request.body?.identifier ?? request.body?.email;

  if (typeof identifier !== 'string' || !identifier.trim()) {
    return fallbackIp(request);
  }

  // Include the origin so failed attempts from an external address cannot
  // exhaust the login allowance used by the real employee elsewhere.
  return `login:${digest(
    `${identifier.trim().toLowerCase()}:${request.ip ?? 'unknown'}`,
  )}`;
}

export function refreshSessionTracker(request: RateLimitRequest): string {
  const refreshToken = request.body?.refreshToken;

  return typeof refreshToken === 'string' && refreshToken
    ? `refresh:${digest(refreshToken)}`
    : fallbackIp(request);
}
