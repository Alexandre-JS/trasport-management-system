import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Minimal shape of the official `@capacitor/preferences` plugin. On native
 * platforms this bridges to the Keychain (iOS) / SharedPreferences (Android),
 * which — unlike `localStorage` — is not reachable from injected/XSS JavaScript.
 */
interface PreferencesPlugin {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}

const Preferences = registerPlugin<PreferencesPlugin>('Preferences');

const ACCESS_TOKEN_KEY = 'lumac_mobile_access_token';
const REFRESH_TOKEN_KEY = 'lumac_mobile_refresh_token';
const USER_KEY = 'lumac_mobile_user';

/**
 * Session tokens are held in memory as the source of truth (never in
 * `localStorage`, so they cannot be exfiltrated by XSS scraping web storage).
 * On native devices they are additionally persisted to secure OS storage via
 * Capacitor Preferences so the session survives app restarts.
 *
 * On the web there is no secure persistence available, so the session is
 * memory-only and is intentionally lost on full reload.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private userJson: string | null = null;

  private readonly usesSecureStore = Capacitor.isNativePlatform();

  /** Hydrate the in-memory cache from secure storage at app startup. */
  async restore(): Promise<void> {
    if (!this.usesSecureStore) {
      return;
    }

    const [access, refresh, user] = await Promise.all([
      this.readSecure(ACCESS_TOKEN_KEY),
      this.readSecure(REFRESH_TOKEN_KEY),
      this.readSecure(USER_KEY),
    ]);

    this.accessToken = access;
    this.refreshToken = refresh;
    this.userJson = user;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  getUserJson(): string | null {
    return this.userJson;
  }

  save(session: {
    accessToken: string;
    refreshToken: string;
    user: unknown;
  }): void {
    this.accessToken = session.accessToken;
    this.refreshToken = session.refreshToken;
    this.userJson = JSON.stringify(session.user);

    void this.writeSecure(ACCESS_TOKEN_KEY, this.accessToken);
    void this.writeSecure(REFRESH_TOKEN_KEY, this.refreshToken);
    void this.writeSecure(USER_KEY, this.userJson);
  }

  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.userJson = null;

    void this.removeSecure(ACCESS_TOKEN_KEY);
    void this.removeSecure(REFRESH_TOKEN_KEY);
    void this.removeSecure(USER_KEY);
  }

  private async readSecure(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch {
      return null;
    }
  }

  private async writeSecure(key: string, value: string): Promise<void> {
    if (!this.usesSecureStore) {
      return;
    }
    try {
      await Preferences.set({ key, value });
    } catch {
      /* best-effort persistence; memory cache remains authoritative */
    }
  }

  private async removeSecure(key: string): Promise<void> {
    if (!this.usesSecureStore) {
      return;
    }
    try {
      await Preferences.remove({ key });
    } catch {
      /* ignore */
    }
  }
}
