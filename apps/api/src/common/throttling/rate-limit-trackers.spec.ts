import {
  authenticatedOrIpTracker,
  loginAccountTracker,
  refreshSessionTracker,
} from './rate-limit-trackers';

describe('rate limit trackers', () => {
  it('separates authenticated sessions without exposing the bearer token', () => {
    const tracker = authenticatedOrIpTracker({
      headers: { authorization: 'Bearer secret-access-token' },
      ip: '10.0.0.1',
    });

    expect(tracker).toMatch(/^session:[a-f0-9]{64}$/);
    expect(tracker).not.toContain('secret-access-token');
  });

  it('separates public tracking links behind the same proxy IP', () => {
    const first = authenticatedOrIpTracker({
      ip: '127.0.0.1',
      params: { token: 'tracking-token-a' },
    });
    const second = authenticatedOrIpTracker({
      ip: '127.0.0.1',
      params: { token: 'tracking-token-b' },
    });

    expect(first).not.toBe(second);
    expect(first).toMatch(/^public:[a-f0-9]{64}$/);
  });

  it('normalizes the login account identifier', () => {
    expect(
      loginAccountTracker({ body: { identifier: ' User@Example.COM ' } }),
    ).toBe(loginAccountTracker({ body: { email: 'user@example.com' } }));
  });

  it('separates refresh sessions without exposing the refresh token', () => {
    const tracker = refreshSessionTracker({
      body: { refreshToken: 'secret-refresh-token' },
    });

    expect(tracker).toMatch(/^refresh:[a-f0-9]{64}$/);
    expect(tracker).not.toContain('secret-refresh-token');
  });

  it('falls back to the request IP when no safe identity exists', () => {
    expect(authenticatedOrIpTracker({ ip: '127.0.0.1' })).toBe('ip:127.0.0.1');
  });
});
