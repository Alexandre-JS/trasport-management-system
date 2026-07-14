import { NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBack, locateOutline, navigateOutline } from 'ionicons/icons';
import * as L from 'leaflet';
import { apiErrorMessage } from '../shared/api-error';
import { DriverMobileService } from '../shared/driver-mobile.service';
import { GeolocationService } from '../shared/geolocation.service';
import type { DriverTrip } from '../shared/api.types';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  imports: [
    NgIf,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class MapPage implements AfterViewInit, OnDestroy {
  private readonly driverMobile = inject(DriverMobileService);
  private readonly geo = inject(GeolocationService);
  private readonly router = inject(Router);

  private map: L.Map | null = null;
  private driverMarker: L.CircleMarker | null = null;
  private trail: L.Polyline | null = null;
  private watchId: string | null = null;
  private follow = true;

  trip: DriverTrip | null = null;
  loading = true;
  statusMessage = 'A obter a sua localização...';
  errorMessage = '';

  constructor() {
    addIcons({ arrowBack, locateOutline, navigateOutline });
  }

  async ngAfterViewInit() {
    this.initMap();
    await this.loadTrip();
    await this.startTracking();
    this.loading = false;
  }

  ngOnDestroy() {
    if (this.watchId) {
      void this.geo.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.map?.remove();
    this.map = null;
  }

  private initMap() {
    // Centro provisório (Moçambique) até chegar a primeira posição real.
    this.map = L.map('driver-map', { zoomControl: false }).setView(
      [-25.9655, 32.5832],
      6,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    this.trail = L.polyline([], { color: '#2563eb', weight: 4 }).addTo(
      this.map,
    );

    // Se o utilizador arrastar o mapa, deixa de o seguir automaticamente.
    this.map.on('dragstart', () => {
      this.follow = false;
    });
  }

  private async loadTrip() {
    this.trip = await new Promise<DriverTrip | null>((resolve) => {
      this.driverMobile.getCurrentTrip().subscribe({
        next: (trip) => resolve(trip),
        error: () => resolve(null),
      });
    });

    if (this.trip) {
      this.loadTrail(this.trip.id);
    }
  }

  private loadTrail(tripId: string) {
    this.driverMobile.getTripRoute(tripId).subscribe({
      next: (route) => {
        const coords = route.points.map(
          (p) => [p.latitude, p.longitude] as L.LatLngTuple,
        );
        this.trail?.setLatLngs(coords);
      },
      error: () => {
        /* trilho é opcional — a posição ao vivo é o essencial */
      },
    });
  }

  private async startTracking() {
    const granted = await this.geo.ensurePermission();
    if (!granted) {
      this.errorMessage =
        'Ative a localização nas definições para ver o seu ponto no mapa.';
      return;
    }

    try {
      const first = await this.geo.getCurrentPosition();
      this.updatePosition(first.coords.latitude, first.coords.longitude);
      this.map?.setView(
        [first.coords.latitude, first.coords.longitude],
        15,
      );
      this.statusMessage = 'A seguir a sua localização em tempo real.';
    } catch {
      this.errorMessage = 'Não foi possível obter o GPS. Verifique se está ligado.';
      return;
    }

    this.watchId = await this.geo.watchPosition(
      (position) =>
        this.updatePosition(
          position.coords.latitude,
          position.coords.longitude,
        ),
      (error) => {
        this.errorMessage = apiErrorMessage(error, 'GPS interrompido.');
      },
    );
  }

  private updatePosition(lat: number, lng: number) {
    if (!this.map) {
      return;
    }

    const latlng: L.LatLngTuple = [lat, lng];

    if (this.driverMarker) {
      this.driverMarker.setLatLng(latlng);
    } else {
      this.driverMarker = L.circleMarker(latlng, {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1,
      }).addTo(this.map);
    }

    // Estende o trilho localmente para dar sensação de movimento imediato.
    this.trail?.addLatLng(latlng);

    if (this.follow) {
      this.map.panTo(latlng, { animate: true });
    }
  }

  recenter() {
    this.follow = true;
    const pos = this.driverMarker?.getLatLng();
    if (pos && this.map) {
      this.map.setView(pos, 15, { animate: true });
    }
  }

  goBack() {
    void this.router.navigateByUrl('/home', { replaceUrl: true });
  }
}
