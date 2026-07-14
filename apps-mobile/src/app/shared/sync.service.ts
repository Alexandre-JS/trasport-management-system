import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

const QUEUE_KEY = 'lumac_mobile_sync_queue';

interface QueuedRequest {
  id: string;
  path: string; // relativo a apiBaseUrl, ex. /driver-mobile/trips/x/tracking-points
  body: unknown;
  kind: 'gps' | 'operation';
  createdAt: string;
}

/**
 * Fila offline-first para o app do motorista. Pontos de GPS e operações
 * (pickup, entrega, incidente, avanço de etapa) são gravados no disco
 * (Capacitor Preferences) e reenviados por ordem quando há rede. Assim o
 * motorista continua a trabalhar em zonas sem cobertura e nada se perde.
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly http = inject(HttpClient);

  private queue: QueuedRequest[] = [];
  private flushing = false;
  private online = true;

  /** Nº de itens por sincronizar — para a UI mostrar ao motorista. */
  readonly pending = signal(0);
  readonly syncing = signal(false);

  async init(): Promise<void> {
    await this.load();

    const status = await Network.getStatus();
    this.online = status.connected;

    Network.addListener('networkStatusChange', (s) => {
      this.online = s.connected;
      if (s.connected) {
        void this.flush();
      }
    });

    if (this.online) {
      void this.flush();
    }
  }

  /**
   * Envia uma operação. Se houver rede, tenta já; se falhar por falta de
   * ligação (ou já estar offline), fica em fila e parte no próximo reconexão.
   * Devolve 'sent' | 'queued'.
   */
  async send(
    path: string,
    body: unknown,
    kind: 'gps' | 'operation',
  ): Promise<'sent' | 'queued'> {
    if (this.online && this.queue.length === 0) {
      try {
        await this.post(path, body);
        return 'sent';
      } catch (error) {
        if (!isNetworkError(error)) {
          throw error; // erro real (validação/permissão) — não faz sentido enfileirar
        }
        this.online = false;
      }
    }

    await this.enqueue({ path, body, kind });
    return 'queued';
  }

  private async enqueue(item: Omit<QueuedRequest, 'id' | 'createdAt'>) {
    this.queue.push({
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    });
    await this.persist();
  }

  /** Reenvia a fila por ordem. Para no primeiro erro de rede. */
  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return;
    }
    this.flushing = true;
    this.syncing.set(true);

    try {
      while (this.queue.length > 0) {
        const head = this.queue[0];
        try {
          await this.post(head.path, head.body);
          this.queue.shift();
          await this.persist();
        } catch (error) {
          if (isNetworkError(error)) {
            this.online = false;
            break; // sem rede — espera o próximo reconexão
          }
          // Rejeitado pelo servidor (4xx): não vai singrar em retry; descarta
          // para não bloquear a fila toda por causa de um item inválido.
          this.queue.shift();
          await this.persist();
        }
      }
    } finally {
      this.flushing = false;
      this.syncing.set(false);
    }
  }

  private post(path: string, body: unknown): Promise<unknown> {
    return firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}${path}`, body),
    );
  }

  private async load() {
    try {
      const { value } = await Preferences.get({ key: QUEUE_KEY });
      this.queue = value ? (JSON.parse(value) as QueuedRequest[]) : [];
    } catch {
      this.queue = [];
    }
    this.pending.set(this.queue.length);
  }

  private async persist() {
    this.pending.set(this.queue.length);
    try {
      await Preferences.set({
        key: QUEUE_KEY,
        value: JSON.stringify(this.queue),
      });
    } catch {
      /* melhor-esforço; a fila em memória continua autoritária nesta sessão */
    }
  }
}

function isNetworkError(error: unknown): boolean {
  // status 0 = pedido não chegou ao servidor (sem rede/DNS/timeout de ligação)
  return error instanceof HttpErrorResponse && error.status === 0;
}
