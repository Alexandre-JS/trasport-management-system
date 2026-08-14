import { createHash } from 'node:crypto';

type RateLimitRequest = {
  body?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
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

  return match?.[1] ? `session:${digest(match[1])}` : fallbackIp(request);
}

export function loginAccountTracker(request: RateLimitRequest): string {
  const identifier = request.body?.identifier ?? request.body?.email;

  if (typeof identifier !== 'string' || !identifier.trim()) {
    return fallbackIp(request);
  }

  return `login:${digest(identifier.trim().toLowerCase())}`;
}

export function refreshSessionTracker(request: RateLimitRequest): string {
  const refreshToken = request.body?.refreshToken;

  return typeof refreshToken === 'string' && refreshToken
    ? `refresh:${digest(refreshToken)}`
    : fallbackIp(request);
}
