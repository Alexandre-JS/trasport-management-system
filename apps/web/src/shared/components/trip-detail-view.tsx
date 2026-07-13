"use client";

import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  ActionButton,
  PrimaryButton,
  SecondaryButton,
} from "@/src/shared/components/action-button";
import { Card } from "@/src/shared/components/card";
import { ConfirmDialog } from "@/src/shared/components/confirm-dialog";
import { ErrorState } from "@/src/shared/components/error-state";
import { PageLoader } from "@/src/shared/components/page-loader";
import { Section } from "@/src/shared/components/section";
import { ShareLinkButton } from "@/src/shared/components/share-link-button";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { useCargo } from "@/hooks/use-cargo";
import { useDrivers } from "@/hooks/use-drivers";
import { useTrailers } from "@/hooks/use-trailers";
import { useTrucks } from "@/hooks/use-trucks";
import {
  useAssignCargo,
  useAssignDriver,
  useAssignTrailer,
  useAssignTruck,
  useCancelTrip,
  useRecordTripEvent,
  useTrip,
  useUpdateTripStatus,
} from "@/hooks/use-trips";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { TripEventType } from "@/types/trip";
import { formatDate, formatDateTime } from "@/utils/format";
import {
  isTerminalTripStatus,
  nextTripStatus,
  tripEventTypeLabel,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

const milestoneTypes: TripEventType[] = [
  "DISPATCHED_ORIGIN",
  "AT_BORDER",
  "BORDER_CLEARED",
  "ARRIVED",
  "DISCHARGED",
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

export function TripDetailView({ id }: { id: string }) {
  const { toast } = useToast();
  const { data: trip, isLoading, isError, refetch } = useTrip(id);

  const [driverId, setDriverId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [eventType, setEventType] = useState<TripEventType>("DISPATCHED_ORIGIN");
  const [occurredAt, setOccurredAt] = useState("");
  const [note, setNote] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const drivers = useDrivers({ status: "AVAILABLE", limit: 100 });
  const trucks = useTrucks({ status: "AVAILABLE", limit: 100 });
  const trailers = useTrailers({ status: "AVAILABLE", limit: 100 });
  const cargo = useCargo({ limit: 100 });

  const assignDriver = useAssignDriver();
  const assignTruck = useAssignTruck();
  const assignTrailer = useAssignTrailer();
  const assignCargo = useAssignCargo();
  const updateStatus = useUpdateTripStatus();
  const cancelTrip = useCancelTrip();
  const recordEvent = useRecordTripEvent();

  function fail(action: string) {
    return (error: unknown) =>
      toast({
        title: `Não foi possível ${action}`,
        description: extractErrorMessage(error),
        type: "error",
      });
  }
  function ok(message: string) {
    return () => toast({ title: message, type: "success" });
  }

  if (isLoading) return <PageLoader />;
  if (isError || !trip) {
    return (
      <ErrorState
        title="Não foi possível carregar a viagem"
        onAction={() => void refetch()}
      />
    );
  }

  const terminal = isTerminalTripStatus(trip.currentStatus);
  const next = nextTripStatus(trip.currentStatus);
  const events = trip.events ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/viagens"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Viagens
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
              {trip.cargo.code}
            </h1>
            <StatusBadge tone={tripStatusBadgeTone[trip.currentStatus]}>
              {tripStatusMeta[trip.currentStatus].label}
            </StatusBadge>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {trip.cargo.origin} → {trip.cargo.destination}
            {trip.currentPosition ? ` · ${trip.currentPosition}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {trip.trackingToken ? (
            <ShareLinkButton token={trip.trackingToken} />
          ) : null}
          {!terminal && next ? (
            <PrimaryButton
              loading={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate(
                  { id, payload: { currentStatus: next } },
                  {
                    onSuccess: ok(
                      `Estado avançado para "${tripStatusMeta[next].label}"`,
                    ),
                    onError: fail("avançar o estado"),
                  },
                )
              }
            >
              Avançar para &quot;{tripStatusMeta[next].label}&quot;
            </PrimaryButton>
          ) : null}
          {!terminal ? (
            <ActionButton
              variant="danger"
              onClick={() => setConfirmCancel(true)}
            >
              Cancelar viagem
            </ActionButton>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + history */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-5">
            <Section title="Detalhes da viagem">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Field label="Horse" value={trip.truck.plateNumber} />
                <Field
                  label="Trailer"
                  value={trip.trailer?.plateNumber ?? "—"}
                />
                <Field label="Motorista" value={trip.driver.fullName} />
                <Field
                  label="Passaporte"
                  value={trip.driver.passportNumber ?? "—"}
                />
                <Field
                  label="Fronteiras"
                  value={
                    trip.borders.length > 0
                      ? trip.borders
                          .map(
                            (crossing) =>
                              crossing.border.name +
                              (crossing.clearedAt
                                ? " ✓"
                                : crossing.arrivedAt
                                  ? " (na fronteira)"
                                  : ""),
                          )
                          .join(" › ")
                      : "—"
                  }
                />
                <Field
                  label="Tonelagem"
                  value={trip.tonnage ? `${trip.tonnage} t` : "—"}
                />
                <Field
                  label="Posição atual"
                  value={trip.currentPosition ?? "—"}
                />
                <Field
                  label="Data de carga"
                  value={formatDate(trip.loadedDate)}
                />
                <Field label="Saída" value={formatDate(trip.departureDate)} />
                <Field
                  label="Chegada"
                  value={formatDate(trip.arrivalDate)}
                />
              </dl>
            </Section>
          </Card>

          <Card className="p-5">
            <Section
              title="Histórico de eventos"
              description="Marcos e mudanças de estado registados nesta viagem."
            >
              {events.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ainda não há eventos registados.
                </p>
              ) : (
                <ol className="flex flex-col gap-4">
                  {events.map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <History className="size-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {tripEventTypeLabel[event.type]}
                          {event.fromStatus && event.toStatus ? (
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              {" "}
                              · {tripStatusMeta[event.fromStatus].label} →{" "}
                              {tripStatusMeta[event.toStatus].label}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(event.occurredAt)}
                          {event.note ? ` · ${event.note}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Section>
          </Card>
        </div>

        {/* Right: lifecycle actions */}
        <div className="flex flex-col gap-6">
          {!terminal ? (
            <>
              <Card className="flex flex-col gap-4 p-5">
                <Section title="Atribuições">
                  <div className="flex flex-col gap-4">
                    <AssignRow
                      label="Motorista"
                      current={trip.driver.fullName}
                      value={driverId}
                      onChange={setDriverId}
                      options={(drivers.data?.data ?? []).map((d) => ({
                        value: d.id,
                        label: d.fullName,
                      }))}
                      loading={assignDriver.isPending}
                      onAssign={() =>
                        assignDriver.mutate(
                          { id, payload: { driverId } },
                          {
                            onSuccess: ok("Motorista atribuído"),
                            onError: fail("atribuir o motorista"),
                          },
                        )
                      }
                    />
                    <AssignRow
                      label="Horse"
                      current={trip.truck.plateNumber}
                      value={truckId}
                      onChange={setTruckId}
                      options={(trucks.data?.data ?? []).map((t) => ({
                        value: t.id,
                        label: t.plateNumber,
                      }))}
                      loading={assignTruck.isPending}
                      onAssign={() =>
                        assignTruck.mutate(
                          { id, payload: { truckId } },
                          {
                            onSuccess: ok("Horse atribuído"),
                            onError: fail("atribuir o horse"),
                          },
                        )
                      }
                    />
                    <AssignRow
                      label="Trailer"
                      current={trip.trailer?.plateNumber ?? "—"}
                      value={trailerId}
                      onChange={setTrailerId}
                      options={(trailers.data?.data ?? []).map((t) => ({
                        value: t.id,
                        label: t.plateNumber,
                      }))}
                      loading={assignTrailer.isPending}
                      onAssign={() =>
                        assignTrailer.mutate(
                          { id, payload: { trailerId } },
                          {
                            onSuccess: ok("Trailer atribuído"),
                            onError: fail("atribuir o trailer"),
                          },
                        )
                      }
                    />
                    <AssignRow
                      label="Carga"
                      current={trip.cargo.code}
                      value={cargoId}
                      onChange={setCargoId}
                      options={(cargo.data?.data ?? []).map((c) => ({
                        value: c.id,
                        label: c.code,
                      }))}
                      loading={assignCargo.isPending}
                      onAssign={() =>
                        assignCargo.mutate(
                          { id, payload: { cargoId } },
                          {
                            onSuccess: ok("Carga atribuída"),
                            onError: fail("atribuir a carga"),
                          },
                        )
                      }
                    />
                  </div>
                </Section>
              </Card>

              <Card className="p-5">
                <Section
                  title="Registar milestone"
                  description="Dispara a transição de estado correspondente."
                >
                  <div className="flex flex-col gap-3">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">
                        Tipo
                      </span>
                      <select
                        value={eventType}
                        onChange={(e) =>
                          setEventType(e.target.value as TripEventType)
                        }
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {milestoneTypes.map((type) => (
                          <option key={type} value={type}>
                            {tripEventTypeLabel[type]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">
                        Data/hora (opcional)
                      </span>
                      <input
                        type="datetime-local"
                        value={occurredAt}
                        onChange={(e) => setOccurredAt(e.target.value)}
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">
                        Nota (opcional)
                      </span>
                      <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ex.: fila na fronteira"
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </label>
                    <PrimaryButton
                      loading={recordEvent.isPending}
                      onClick={() =>
                        recordEvent.mutate(
                          {
                            id,
                            payload: {
                              type: eventType,
                              occurredAt: occurredAt
                                ? new Date(occurredAt).toISOString()
                                : undefined,
                              note: note.trim() || undefined,
                            },
                          },
                          {
                            onSuccess: () => {
                              toast({
                                title: "Milestone registado",
                                type: "success",
                              });
                              setNote("");
                              setOccurredAt("");
                            },
                            onError: fail("registar o milestone"),
                          },
                        )
                      }
                    >
                      Registar
                    </PrimaryButton>
                  </div>
                </Section>
              </Card>
            </>
          ) : (
            <Card className="p-5">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Esta viagem está{" "}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {tripStatusMeta[trip.currentStatus].label.toLowerCase()}
                </span>
                . Não há mais ações de ciclo de vida disponíveis.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar esta viagem?"
        description="A viagem passa a CANCELADA e os recursos (motorista/horse) são libertados. Esta ação não pode ser revertida."
        confirmLabel="Cancelar viagem"
        cancelLabel="Voltar"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          cancelTrip.mutate(id, {
            onSuccess: ok("Viagem cancelada"),
            onError: fail("cancelar a viagem"),
          });
        }}
      />
    </div>
  );
}

type AssignRowProps = {
  label: string;
  current: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  loading: boolean;
  onAssign: () => void;
};

function AssignRow({
  label,
  current,
  value,
  onChange,
  options,
  loading,
  onAssign,
}: AssignRowProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Atual: {current}
        </span>
      </div>
      <div className="mt-1.5 flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Selecionar disponível…</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SecondaryButton
          onClick={onAssign}
          loading={loading}
          disabled={!value}
        >
          Atribuir
        </SecondaryButton>
      </div>
    </div>
  );
}
