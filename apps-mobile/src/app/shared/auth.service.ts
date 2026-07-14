import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, AuthUser } from './api.types';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);

  // Garante que renovações concorrentes (vários pedidos a levar 401 ao mesmo
  // tempo) partilham uma única chamada a /auth/refresh.
  private refreshInFlight: Promise<boolean> | null = null;

  /**
   * Restaura a sessão persistida e, se houver refresh token, renova já o
   * access token — assim, ao abrir a app o motorista fica com uma sessão
   * fresca sem ter de escrever credenciais. Chamado uma vez no arranque.
   */
  async restoreSession(): Promise<void> {
    await this.storage.restore();
    if (this.storage.getRefreshToken()) {
      // Renovar em background: se falhar por falta de rede, mantém-se a
      // sessão guardada e tenta-se de novo no primeiro pedido/reconexão.
      void this.tryRefresh();
    }
  }

  /** identifier: email, telefone ou nº da carta de condução do motorista. */
  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, {
        identifier,
        password,
      })
      .pipe(tap((response) => this.storage.save(response)));
  }

  /**
   * Renova o par de tokens usando o refresh token guardado. Como o servidor
   * roda o refresh token a cada renovação (validade 30 dias), um motorista
   * que abra a app pelo menos uma vez por mês nunca mais faz login.
   * Devolve true se a sessão continua válida.
   */
  async tryRefresh(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    this.refreshInFlight = (async () => {
      try {
        const response = await firstValueFrom(
          this.http.post<AuthResponse>(
            `${environment.apiBaseUrl}/auth/refresh`,
            { refreshToken },
          ),
        );
        this.storage.save(response);
        return true;
      } catch (error) {
        // Só limpar a sessão quando o refresh foi mesmo rejeitado (token
        // expirado/revogado). Falha de rede mantém a sessão para nova tentativa.
        if (isAuthRejection(error)) {
          this.storage.clear();
        }
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  logout() {
    this.storage.clear();
  }

  isAuthenticated() {
    return Boolean(this.accessToken || this.storage.getRefreshToken());
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

function isAuthRejection(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  return status === 400 || status === 401 || status === 403;
}
