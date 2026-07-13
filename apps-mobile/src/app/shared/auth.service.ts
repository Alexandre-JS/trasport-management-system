import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, AuthUser } from './api.types';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);

  /** Restore a persisted session (called once at app startup). */
  restoreSession(): Promise<void> {
    return this.storage.restore();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(tap((response) => this.storage.save(response)));
  }

  logout() {
    this.storage.clear();
  }

  isAuthenticated() {
    return Boolean(this.accessToken);
  }

  get accessToken(): string | null {
    return this.storage.getAccessToken();
  }

  get user(): AuthUser | null {
    const raw = this.storage.getUserJson();
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  authHeaders() {
    const token = this.accessToken;
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }
}
