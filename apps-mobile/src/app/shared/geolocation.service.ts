import { Injectable } from '@angular/core';
import { Geolocation, type Position } from '@capacitor/geolocation';

/**
 * Geolocalização via plugin nativo do Capacitor (não o navigator.geolocation
 * do WebView, que não pede permissão nativa no Android e por isso falhava).
 * Trata do pedido de permissão em runtime e expõe leitura pontual + contínua.
 */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  /** Garante a permissão de localização; devolve true se concedida. */
  async ensurePermission(): Promise<boolean> {
    try {
      const status = await Geolocation.checkPermissions();
      if (status.location === 'granted' || status.coarseLocation === 'granted') {
        return true;
      }
      const requested = await Geolocation.requestPermissions({
        permissions: ['location'],
      });
      return (
        requested.location === 'granted' ||
        requested.coarseLocation === 'granted'
      );
    } catch {
      return false;
    }
  }

  async getCurrentPosition(): Promise<Position> {
    return Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });
  }

  /**
   * Observa a posição em contínuo. Devolve o id do watch (string) para depois
   * limpar com clearWatch. O callback recebe cada nova posição ou um erro.
   */
  async watchPosition(
    onUpdate: (position: Position) => void,
    onError: (error: unknown) => void,
  ): Promise<string> {
    return Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
      (position, err) => {
        if (err || !position) {
          onError(err ?? new Error('Sem posição'));
          return;
        }
        onUpdate(position);
      },
    );
  }

  async clearWatch(id: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id });
    } catch {
      /* watch já removido */
    }
  }
}
