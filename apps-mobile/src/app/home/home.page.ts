import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowForwardOutline,
  cameraOutline,
  checkmarkCircleOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  cubeOutline,
  locationOutline,
  logOutOutline,
  mapOutline,
  navigateOutline,
  playOutline,
  refreshOutline,
} from 'ionicons/icons';
import { DriverTrip } from '../shared/api.types';
import { AuthService } from '../shared/auth.service';
import { GeolocationService } from '../shared/geolocation.service';
import type { Position } from '@capacitor/geolocation';
import { DriverMobileService } from '../shared/driver-mobile.service';
import { SyncService } from '../shared/sync.service';
import { Preferences } from '@capacitor/preferences';
import { apiErrorMessage } from '../shared/api-error';

interface DriverAction {
  label: string;
  detail: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning';
  action: 'delivery' | 'incident' | 'gps';
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    FormsModule,
    NgFor,
    NgIf,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private static readonly AUTO_GPS_MIN_INTERVAL_MS = 15000;
  private static readonly TRIP_CACHE_KEY = 'lumac_mobile_current_trip';

  private readonly auth = inject(AuthService);
  private readonly driverMobile = inject(DriverMobileService);
  private readonly geo = inject(GeolocationService);
  private readonly sync = inject(SyncService);
  readonly pendingSync = this.sync.pending;
  private readonly router = inject(Router);
  private lastAutoGpsAt = 0;
  private trackingWatchId: string | null = null;

  currentTrip: DriverTrip | null = null;
  errorMessage = '';
  statusMessage = '';
  trackingStatus = 'GPS a iniciar...';
  isLoading = false;
  isSubmitting = false;
  isAutoTracking = false;
  activeForm: 'delivery' | 'incident' | 'return' | null = null;

  receiverName = '';
  receiverDocument = '';
  deliveryObservations = '';
  deliveryPhoto = '';
  signature = '';
  podDocument = '';
  returnReceiverName = '';
  returnedTo = '';
  returnPod = '';
  incidentType = 'BREAKDOWN';
  incidentDescription = '';
  incidentPhoto = '';

  private readonly secondaryActions: DriverAction[] = [
    {
      label: 'Entreguei a carga',
      detail: 'Informar quem recebeu',
      icon: 'camera-outline',
      tone: 'primary',
      action: 'delivery',
    },
    {
      label: 'Tenho problema',
      detail: 'Acidente, avaria ou bloqueio',
      icon: 'alert-circle-outline',
      tone: 'warning',
      action: 'incident',
    },
    {
      label: 'Enviar localizacao',
      detail: 'Partilhar GPS com a central',
      icon: 'cloud-done-outline',
      tone: 'primary',
      action: 'gps',
    },
  ];

  incidentTypes = [
    { value: 'ACCIDENT', label: 'Acidente' },
    { value: 'BREAKDOWN', label: 'Avaria' },
    { value: 'TRAFFIC', label: 'Transito' },
    { value: 'ROAD_BLOCKED', label: 'Estrada bloqueada' },
    { value: 'OTHER', label: 'Outro' },
  ];

  constructor() {
    addIcons({
      alertCircleOutline,
      arrowForwardOutline,
      cameraOutline,
      checkmarkCircleOutline,
      cloudDoneOutline,
      cloudOfflineOutline,
      cubeOutline,
      locationOutline,
      logOutOutline,
      mapOutline,
      navigateOutline,
      playOutline,
      refreshOutline,
    });
  }

  ngOnInit() {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.loadCurrentTrip();
  }

  ngOnDestroy() {
    this.stopAutoTracking();
  }

  /** The crossing the driver still has to clear (first uncleared), if any. */
  get pendingBorder() {
    return (
      this.currentTrip?.borders.find((crossing) => !crossing.clearedAt) ?? null
    );
  }

  /** Route summary like "Machipanda ✓ › Chirundu", or null without borders. */
  get borderRoute() {
    const borders = this.currentTrip?.borders ?? [];
    if (borders.length === 0) {
      return null;
    }
    return borders
      .map(
        (crossing) => crossing.border.name + (crossing.clearedAt ? ' ✓' : ''),
      )
      .join(' › ');
  }

  get statusLabel() {
    const status = this.currentTrip?.currentStatus ?? '';

    if (status === 'AT_BORDER' && this.pendingBorder) {
      return `Na fronteira de ${this.pendingBorder.border.name}`;
    }

    const labels: Record<string, string> = {
      WAITING_APPOINTMENT: 'Aguardando instrucoes',
      APPOINTMENT_DONE: 'Pode carregar',
      LOADED: 'Carga pronta',
      DISPATCHED_ORIGIN: 'Em viagem',
      AT_BORDER: 'Na fronteira',
      BORDER_CLEARED: 'Fronteira liberada',
      ARRIVED: 'Chegou ao destino',
      DISCHARGED: 'Entregue',
      CONTAINER_RETURN_PENDING: 'Container por devolver',
      CONTAINER_RETURNED: 'Container devolvido',
    };

    return labels[status] ?? 'Viagem ativa';
  }

  get mainActionLabel() {
    const status = this.currentTrip?.currentStatus ?? '';

    // Depois do despacho e de cada fronteira liberada, o proximo passo
    // depende da rota: mais uma fronteira pendente ou o destino.
    if (status === 'DISPATCHED_ORIGIN' || status === 'BORDER_CLEARED') {
      const pending = this.pendingBorder;
      return pending
        ? `Cheguei a ${pending.border.name}`
        : 'Cheguei ao destino';
    }

    if (status === 'AT_BORDER' && this.pendingBorder) {
      return `Sai de ${this.pendingBorder.border.name}`;
    }

    const labels: Record<string, string> = {
      WAITING_APPOINTMENT: 'Marcacao feita',
      APPOINTMENT_DONE: 'Carga carregada',
      LOADED: 'Sair da origem',
      AT_BORDER: 'Fronteira liberada',
      ARRIVED: 'Entregar carga',
      DISCHARGED: 'Viagem concluida',
    };

    return labels[status] ?? 'Atualizar etapa';
  }

  get mainActionHelp() {
    const status = this.currentTrip?.currentStatus;

    if (status === 'ARRIVED') {
      return 'Use quando entregar ao cliente.';
    }

    if (status === 'DISCHARGED') {
      return 'Esta viagem ja terminou.';
    }

    return 'Toque so quando esta etapa acontecer de verdade.';
  }

  get mainActionDisabled() {
    return this.isSubmitting || this.currentTrip?.currentStatus === 'DISCHARGED';
  }

  get quickActions() {
    if (this.currentTrip?.currentStatus === 'ARRIVED') {
      return this.secondaryActions;
    }

    return this.secondaryActions.filter((action) => action.action !== 'delivery');
  }

  get isContainerCargo() {
    return this.currentTrip?.cargo.type === 'CONTAINER';
  }

  /** Container descarregado e ainda por devolver: mostrar CTA de devolução. */
  get needsContainerReturn() {
    return (
      this.isContainerCargo &&
      this.currentTrip?.currentStatus === 'DISCHARGED' &&
      !this.currentTrip?.containerReturn?.returnedAt
    );
  }

  get containerReturnInProgress() {
    return this.currentTrip?.currentStatus === 'CONTAINER_RETURN_PENDING';
  }

  get containerReturned() {
    return this.currentTrip?.currentStatus === 'CONTAINER_RETURNED';
  }

  startContainerReturn() {
    if (!this.currentTrip) {
      return;
    }
    this.submit(
      () => this.driverMobile.startContainerReturn(this.currentTrip!.id),
      () => {
        this.activeForm = 'return';
      },
    );
  }

  openReturnForm() {
    this.activeForm = 'return';
  }

  confirmContainerReturn() {
    if (!this.currentTrip) {
      return;
    }
    this.submit(() =>
      this.driverMobile.confirmContainerReturn(this.currentTrip!.id, {
        returnedTo: this.returnedTo || undefined,
        receiverName: this.returnReceiverName || undefined,
        podDocument: this.returnPod || undefined,
      }),
    );
  }

  /** Lê um ficheiro (foto/PDF do POD) para base64 e guarda no campo dado. */
  onPodFile(event: Event, target: 'delivery' | 'return') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result as string;
      if (target === 'delivery') {
        this.podDocument = value;
      } else {
        this.returnPod = value;
      }
    };
    reader.readAsDataURL(file);
  }

  private async showCachedTrip() {
    if (this.currentTrip) {
      return;
    }
    try {
      const { value } = await Preferences.get({
        key: HomePage.TRIP_CACHE_KEY,
      });
      if (value && !this.currentTrip) {
        this.currentTrip = JSON.parse(value) as DriverTrip;
        this.isLoading = false;
      }
    } catch {
      /* sem cache */
    }
  }

  loadCurrentTrip() {
    this.isLoading = true;
    this.errorMessage = '';

    // Arranque rápido: mostra já a última viagem guardada enquanto a rede
    // responde (ou fica-se por ela se estiver offline).
    void this.showCachedTrip();

    this.driverMobile.getCurrentTrip().subscribe({
      next: (trip) => {
        this.currentTrip = trip;
        this.isLoading = false;
        void Preferences.set({
          key: HomePage.TRIP_CACHE_KEY,
          value: JSON.stringify(trip),
        });
        this.startAutoTracking();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        if (this.currentTrip) {
          // Offline mas com viagem em cache — continua operacional.
          this.startAutoTracking();
          return;
        }
        this.stopAutoTracking();
        this.errorMessage = apiErrorMessage(
          error,
          'Não foi encontrada viagem ativa para este motorista.',
        );
      },
    });
  }

  handleAction(action: DriverAction) {
    if (action.action === 'gps') {
      this.sendGps();
      return;
    }

    this.activeForm = action.action;
    this.statusMessage = '';
  }

  handleMainAction() {
    const status = this.currentTrip?.currentStatus;

    if (status === 'ARRIVED') {
      this.activeForm = 'delivery';
      return;
    }

    if (status === 'DISCHARGED') {
      return;
    }

    this.advanceTrip();
  }

  advanceTrip() {
    if (!this.currentTrip) {
      return;
    }

    const tripId = this.currentTrip.id;
    this.submit(() =>
      this.driverMobile.advanceTrip(tripId),
      () => this.sendGpsAfterOperation(tripId),
    );
  }

  confirmDelivery() {
    if (!this.currentTrip) {
      return;
    }

    this.submit(() =>
      this.driverMobile.confirmDelivery(this.currentTrip!.id, {
        receiverName: this.receiverName || undefined,
        receiverDocument: this.receiverDocument || undefined,
        deliveryPhoto: this.deliveryPhoto || undefined,
        signature: this.signature || undefined,
        podDocument: this.podDocument || undefined,
        observations: this.deliveryObservations || undefined,
      }),
    );
  }

  reportIncident() {
    if (!this.currentTrip) {
      return;
    }

    this.submit(() =>
      this.driverMobile.reportIncident(this.currentTrip!.id, {
        type: this.incidentType,
        description: this.incidentDescription || undefined,
        photo: this.incidentPhoto || undefined,
      }),
    );
  }

  async sendGps() {
    if (!this.currentTrip) {
      this.errorMessage = 'Sem viagem ativa para enviar localização.';
      return;
    }

    this.isSubmitting = true;

    const granted = await this.geo.ensurePermission();
    if (!granted) {
      this.afterError(
        'Permissão de localização negada. Ative-a nas definições do telemóvel.',
      );
      return;
    }

    try {
      const position = await this.geo.getCurrentPosition();
      const result = await this.sync.send(
        `/driver-mobile/trips/${this.currentTrip.id}/tracking-points`,
        this.toPayload(position),
        'gps',
      );
      this.afterSubmit(
        result === 'sent'
          ? 'Localização enviada para a central.'
          : 'Sem rede — localização guardada e enviada quando houver ligação.',
      );
    } catch {
      this.afterError('Não foi possível obter o GPS. Verifique se está ligado.');
    }
  }

  private toPayload(position: Position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      accuracy: position.coords.accuracy ?? undefined,
      recordedAt: new Date().toISOString(),
    };
  }

  openMap() {
    void this.router.navigateByUrl('/map');
  }

  logout() {
    void this.stopAutoTracking();
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private async startAutoTracking() {
    if (!this.currentTrip || this.trackingWatchId !== null) {
      return;
    }

    const granted = await this.geo.ensurePermission();
    if (!granted) {
      this.isAutoTracking = false;
      this.trackingStatus = 'Ative a localização para a central ver o camião.';
      return;
    }

    this.trackingStatus = 'GPS em tempo real a iniciar...';
    try {
      this.trackingWatchId = await this.geo.watchPosition(
        (position) => this.sendAutoGps(position),
        () => {
          this.isAutoTracking = false;
          this.trackingStatus = 'GPS interrompido. Verifique se está ligado.';
        },
      );
      this.isAutoTracking = true;
      this.trackingStatus = 'GPS em tempo real ligado.';
    } catch {
      this.isAutoTracking = false;
      this.trackingStatus = 'Não foi possível ativar o GPS.';
    }
  }

  private async stopAutoTracking() {
    if (this.trackingWatchId === null) {
      return;
    }

    const id = this.trackingWatchId;
    this.trackingWatchId = null;
    this.isAutoTracking = false;
    await this.geo.clearWatch(id);
  }

  private async sendAutoGps(position: Position) {
    if (!this.currentTrip) {
      return;
    }

    const now = Date.now();
    if (now - this.lastAutoGpsAt < HomePage.AUTO_GPS_MIN_INTERVAL_MS) {
      return;
    }

    this.lastAutoGpsAt = now;
    this.isAutoTracking = true;
    try {
      const result = await this.sync.send(
        `/driver-mobile/trips/${this.currentTrip.id}/tracking-points`,
        this.toPayload(position),
        'gps',
      );
      this.trackingStatus =
        result === 'sent'
          ? 'GPS enviado para a central.'
          : 'Sem rede — a guardar o GPS para enviar depois.';
    } catch {
      this.trackingStatus = 'GPS ligado. A central atualiza quando houver rede.';
    }
  }

  private submit(request: () => Observable<unknown>, afterSuccess?: () => void) {
    this.isSubmitting = true;
    this.errorMessage = '';
    request().subscribe({
      next: () => {
        afterSuccess?.();
        this.afterSubmit('Operacao enviada com sucesso.');
      },
      error: (error: unknown) =>
        this.afterError(
          apiErrorMessage(error, 'Não foi possível concluir a operação.'),
        ),
    });
  }

  private async sendGpsAfterOperation(tripId: string) {
    const granted = await this.geo.ensurePermission();
    if (!granted) {
      this.statusMessage = 'Operação feita. Ative o GPS quando puder.';
      return;
    }

    try {
      const position = await this.geo.getCurrentPosition();
      await this.sync.send(
        `/driver-mobile/trips/${tripId}/tracking-points`,
        this.toPayload(position),
        'gps',
      );
      this.statusMessage = 'Operação feita. Localização registada.';
    } catch {
      this.statusMessage = 'Operação feita. Ligue o GPS quando puder.';
    }
  }

  private afterSubmit(message: string) {
    this.isSubmitting = false;
    this.statusMessage = message;
    this.activeForm = null;
    this.loadCurrentTrip();
  }

  private afterError(message: string) {
    this.isSubmitting = false;
    this.errorMessage = message;
  }
}
