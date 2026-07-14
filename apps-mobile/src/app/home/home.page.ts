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
  locationOutline,
  logOutOutline,
  navigateOutline,
  playOutline,
  refreshOutline,
} from 'ionicons/icons';
import { DriverTrip } from '../shared/api.types';
import { AuthService } from '../shared/auth.service';
import { DriverMobileService } from '../shared/driver-mobile.service';
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

  private readonly auth = inject(AuthService);
  private readonly driverMobile = inject(DriverMobileService);
  private readonly router = inject(Router);
  private lastAutoGpsAt = 0;
  private trackingWatchId: number | null = null;

  currentTrip: DriverTrip | null = null;
  errorMessage = '';
  statusMessage = '';
  trackingStatus = 'GPS a iniciar...';
  isLoading = false;
  isSubmitting = false;
  isAutoTracking = false;
  activeForm: 'delivery' | 'incident' | null = null;

  receiverName = '';
  receiverDocument = '';
  deliveryObservations = '';
  deliveryPhoto = '';
  signature = '';
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
      locationOutline,
      logOutOutline,
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

  loadCurrentTrip() {
    this.isLoading = true;
    this.errorMessage = '';
    this.driverMobile.getCurrentTrip().subscribe({
      next: (trip) => {
        this.currentTrip = trip;
        this.isLoading = false;
        this.startAutoTracking();
      },
      error: (error: unknown) => {
        this.currentTrip = null;
        this.isLoading = false;
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

  sendGps() {
    if (!this.currentTrip || !navigator.geolocation) {
      this.errorMessage = 'GPS indisponivel neste dispositivo.';
      return;
    }

    this.isSubmitting = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.driverMobile
          .sendTrackingPoint(this.currentTrip!.id, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed ?? undefined,
            heading: position.coords.heading ?? undefined,
            accuracy: position.coords.accuracy ?? undefined,
            recordedAt: new Date().toISOString(),
          })
          .subscribe({
            next: () => this.afterSubmit('Localizacao enviada para a central.'),
            error: () => this.afterError('Nao foi possivel enviar a localizacao.'),
          });
      },
      () => this.afterError('Permissao de GPS negada ou indisponivel.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  logout() {
    this.stopAutoTracking();
    this.auth.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private startAutoTracking() {
    if (!this.currentTrip || this.trackingWatchId !== null) {
      return;
    }

    if (!navigator.geolocation) {
      this.isAutoTracking = false;
      this.trackingStatus = 'GPS indisponivel neste dispositivo.';
      return;
    }

    this.isAutoTracking = true;
    this.trackingStatus = 'GPS em tempo real ligado.';
    this.trackingWatchId = navigator.geolocation.watchPosition(
      (position) => this.sendAutoGps(position),
      () => {
        this.isAutoTracking = false;
        this.trackingStatus = 'Permita o GPS para a central ver o camiao.';
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );
  }

  private stopAutoTracking() {
    if (this.trackingWatchId === null) {
      return;
    }

    navigator.geolocation.clearWatch(this.trackingWatchId);
    this.trackingWatchId = null;
    this.isAutoTracking = false;
  }

  private sendAutoGps(position: GeolocationPosition) {
    if (!this.currentTrip) {
      return;
    }

    const now = Date.now();
    if (now - this.lastAutoGpsAt < HomePage.AUTO_GPS_MIN_INTERVAL_MS) {
      return;
    }

    this.lastAutoGpsAt = now;
    this.driverMobile
      .sendTrackingPoint(this.currentTrip.id, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
        accuracy: position.coords.accuracy ?? undefined,
        recordedAt: new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.isAutoTracking = true;
          this.trackingStatus = 'GPS enviado para a central.';
        },
        error: (error: unknown) => {
          this.trackingStatus = apiErrorMessage(
            error,
            'GPS ligado, mas o envio falhou agora. Volta a tentar sozinho.',
          );
        },
      });
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

  private sendGpsAfterOperation(tripId: string) {
    if (!navigator.geolocation) {
      this.statusMessage = 'Operacao feita. GPS indisponivel.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.driverMobile
          .sendTrackingPoint(tripId, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed ?? undefined,
            heading: position.coords.heading ?? undefined,
            accuracy: position.coords.accuracy ?? undefined,
            recordedAt: new Date().toISOString(),
          })
          .subscribe({
            next: () => {
              this.statusMessage = 'Operacao feita. Localizacao enviada.';
            },
            error: () => {
              this.statusMessage = 'Operacao feita. GPS nao foi enviado.';
            },
          });
      },
      () => {
        this.statusMessage = 'Operacao feita. Ligue o GPS quando puder.';
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
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
