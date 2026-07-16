import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  DeliveryPayload,
  DriverTrip,
  DriverTripsResponse,
  IncidentPayload,
  PickupPayload,
  ContainerReturnPayload,
  TrackingPointPayload,
  TripRouteResponse,
} from './api.types';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DriverMobileService {
  private readonly baseUrl = `${environment.apiBaseUrl}/driver-mobile`;
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  getCurrentTrip() {
    return this.http.get<DriverTrip | null>(`${this.baseUrl}/trips/current`, {
      headers: this.auth.authHeaders(),
    });
  }

  listTrips() {
    return this.http.get<DriverTripsResponse>(`${this.baseUrl}/trips`, {
      headers: this.auth.authHeaders(),
    });
  }

  getTrip(tripId: string) {
    return this.http.get<DriverTrip>(`${this.baseUrl}/trips/${tripId}`, {
      headers: this.auth.authHeaders(),
    });
  }

  advanceTrip(tripId: string) {
    return this.http.post<DriverTrip>(
      `${this.baseUrl}/trips/${tripId}/advance`,
      {},
      { headers: this.auth.authHeaders() },
    );
  }

  confirmPickup(tripId: string, payload: PickupPayload) {
    return this.http.post(`${this.baseUrl}/trips/${tripId}/pickup`, payload, {
      headers: this.auth.authHeaders(),
    });
  }

  confirmDelivery(tripId: string, payload: DeliveryPayload) {
    return this.http.post(`${this.baseUrl}/trips/${tripId}/delivery`, payload, {
      headers: this.auth.authHeaders(),
    });
  }

  reportIncident(tripId: string, payload: IncidentPayload) {
    return this.http.post(`${this.baseUrl}/trips/${tripId}/incidents`, payload, {
      headers: this.auth.authHeaders(),
    });
  }

  sendTrackingPoint(tripId: string, payload: TrackingPointPayload) {
    return this.http.post(
      `${this.baseUrl}/trips/${tripId}/tracking-points`,
      payload,
      { headers: this.auth.authHeaders() },
    );
  }

  getTripRoute(tripId: string) {
    return this.http.get<TripRouteResponse>(
      `${this.baseUrl}/trips/${tripId}/route`,
      { headers: this.auth.authHeaders() },
    );
  }

  startContainerReturn(tripId: string) {
    return this.http.post(
      `${this.baseUrl}/trips/${tripId}/container-return/start`,
      {},
      { headers: this.auth.authHeaders() },
    );
  }

  confirmContainerReturn(tripId: string, payload: ContainerReturnPayload) {
    return this.http.post(
      `${this.baseUrl}/trips/${tripId}/container-return/confirm`,
      payload,
      { headers: this.auth.authHeaders() },
    );
  }
}
