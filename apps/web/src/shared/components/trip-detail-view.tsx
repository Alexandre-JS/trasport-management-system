"use client";

import {
  ArrowLeft,
  ChevronDown,
  MapPin,
  Route,
  Truck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ActionButton,
  PrimaryButton,
  SecondaryButton,
} from "@/src/shared/components/action-button";
import { Card } from "@/src/shared/components/card";
import { ConfirmDialog } from "@/src/shared/components/confirm-dialog";
import { ErrorState } from "@/src/shared/components/error-state";
import { PageLoader } from "@/src/shared/components/page-loader";
import { PrintButton } from "@/src/shared/components/print-button";
import { PrintShipmentDocument } from "@/src/shared/components/print-shipment-document";
import { Section } from "@/src/shared/components/section";
import { ShareLinkButton } from "@/src/shared/components/share-link-button";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { ContainerReturnPanel } from "@/components/trips/container-return-panel";
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid border-b border-slate-100 last:border-b-0 sm:grid-cols-[minmax(10rem,34%)_1fr] dark:border-slate-800">
      <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function TableGroup({ children }: { children: string }) {
  return (
    <div className="border-b border-slate-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-700 last:border-b-0 dark:border-slate-700 dark:bg-brand-950/40 dark:text-brand-200">
      <dt>{children}</dt>
      <dd className="sr-only">Campos da secção {children}</dd>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[2.5rem_1fr] border-b border-r border-slate-200 last:border-r-0 sm:border-b-0 dark:border-slate-700">
      <span className="grid place-items-center bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-200">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {label}
        </p>
        <p className="truncate bg-white px-3 py-2 text-sm font-semibold text-slate-900 dark:bg-slate-900 dark:text-slate-100" title={value}>
          {value}
        </p>
      </div>
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
            data-print-hide
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
          <PrintButton label="Imprimir ficha" />
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

      <section
        aria-label="Resumo operacional da viagem"
        className="grid overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4 dark:border-slate-700 dark:bg-slate-900"
      >
        <SummaryItem
          label="Próxima etapa"
          value={next ? tripStatusMeta[next].label : "Ciclo concluído"}
          icon={<Route className="size-4" aria-hidden />}
        />
        <SummaryItem
          label="Posição atual"
          value={trip.currentPosition ?? "Sem posição registada"}
          icon={<MapPin className="size-4" aria-hidden />}
        />
        <SummaryItem
          label="Motorista"
          value={trip.driverName ?? trip.driver?.fullName ?? "—"}
          icon={<UserRound className="size-4" aria-hidden />}
        />
        <SummaryItem
          label="Equipamento"
          value={`${trip.horsePlate ?? trip.truck?.plateNumber ?? "—"}${(trip.trailerPlate ?? trip.trailer?.plateNumber) ? ` · ${trip.trailerPlate ?? trip.trailer?.plateNumber}` : ""}`}
          icon={<Truck className="size-4" aria-hidden />}
        />
      </section>

      {terminal ? (
        <div className="flex items-center justify-between gap-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              Viagem concluída · {tripStatusMeta[trip.currentStatus].label}
            </p>
            <p className="mt-0.5 text-emerald-700 dark:text-emerald-300">
              Não existem mais ações de ciclo de vida. Os dados abaixo ficam disponíveis para consulta.
            </p>
          </div>
          <StatusBadge tone={tripStatusBadgeTone[trip.currentStatus]}>
            {tripStatusMeta[trip.currentStatus].label}
          </StatusBadge>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + history */}
        <div
          className={`flex flex-col gap-6 ${terminal ? "lg:col-span-3" : "lg:col-span-2"}`}
        >
          <Card className="p-5">
            <Section
              title="Informação da viagem"
              description="Dados da carga, recursos atribuídos, rota e datas operacionais."
            >
              <dl className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-[minmax(10rem,34%)_1fr] border-b border-slate-300 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <dt className="border-r border-slate-300 px-4 py-2 dark:border-slate-700">
                    Campo
                  </dt>
                  <dd className="px-4 py-2">Valor</dd>
                </div>
                <TableGroup>Carga e rota</TableGroup>
                <DetailRow label="Carga" value={trip.cargo.code} />
                <DetailRow
                  label="Rota"
                  value={`${trip.cargo.origin} → ${trip.cargo.destination}`}
                />
                <DetailRow
                  label="Tonelagem"
                  value={trip.tonnage ? `${trip.tonnage} t` : "—"}
                />
                <TableGroup>Recursos atribuídos</TableGroup>
                <DetailRow label="Horse" value={trip.horsePlate ?? trip.truck?.plateNumber ?? "—"} />
                <DetailRow
                  label="Trailer"
                  value={trip.trailer?.plateNumber ?? "—"}
                />
                <DetailRow label="Motorista" value={trip.driverName ?? trip.driver?.fullName ?? "—"} />
                <DetailRow
                  label="Passaporte"
                  value={trip.driverPassport ?? trip.driver?.passportNumber ?? "—"}
                />
                <TableGroup>Localização e percurso</TableGroup>
                <DetailRow
                  label="Borders (Fronteiras)"
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
                <DetailRow
                  label="Posição atual"
                  value={trip.currentPosition ?? "—"}
                />
                <TableGroup>Datas operacionais</TableGroup>
                <DetailRow
                  label="Data de carga"
                  value={formatDate(trip.loadedDate)}
                />
                <DetailRow label="Saída" value={formatDate(trip.departureDate)} />
                <DetailRow
                  label="Chegada"
                  value={formatDate(trip.arrivalDate)}
                />
              </dl>
            </Section>
          </Card>

          <ContainerReturnPanel
            tripId={trip.id}
            status={trip.currentStatus}
          />

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
                <div className="max-h-[28rem] overflow-auto rounded-md border border-slate-300 dark:border-slate-700">
                  <table className="min-w-full border-separate border-spacing-0 text-[13px] leading-4 tabular-nums [&_td]:!px-2.5 [&_td]:!py-1.5 [&_th]:!px-2.5 [&_th]:!py-2">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <tr>
                        <th className="whitespace-nowrap border-b border-r border-slate-300 px-3 py-2 dark:border-slate-700">Data/hora</th>
                        <th className="whitespace-nowrap border-b border-r border-slate-300 px-3 py-2 dark:border-slate-700">Evento</th>
                        <th className="whitespace-nowrap border-b border-r border-slate-300 px-3 py-2 dark:border-slate-700">Estado anterior</th>
                        <th className="whitespace-nowrap border-b border-r border-slate-300 px-3 py-2 dark:border-slate-700">Estado seguinte</th>
                        <th className="whitespace-nowrap border-b border-slate-300 px-3 py-2 dark:border-slate-700">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id} className="odd:bg-white even:bg-slate-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-900/60">
                          <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                            {formatDateTime(event.occurredAt)}
                          </td>
                          <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 font-medium text-slate-900 dark:border-slate-800 dark:text-slate-100">
                            {tripEventTypeLabel[event.type]}
                          </td>
                          <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                            {event.fromStatus ? tripStatusMeta[event.fromStatus].label : "—"}
                          </td>
                          <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2.5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                            {event.toStatus ? tripStatusMeta[event.toStatus].label : "—"}
                          </td>
                          <td className="min-w-52 border-b border-slate-200 px-3 py-2.5 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                            {event.note ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </Card>
        </div>

        {/* Right: lifecycle actions */}
        {!terminal ? (
          <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ações operacionais
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Abra apenas a ação que pretende executar.
              </p>
            </div>
              <Card className="overflow-hidden p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/50">
                    Alterar recursos atribuídos
                    <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-slate-200 p-5 dark:border-slate-800">
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                      Use apenas quando for necessário substituir recursos desta viagem.
                    </p>
                  <div className="flex flex-col gap-4">
                    <AssignRow
                      label="Motorista"
                      current={trip.driverName ?? trip.driver?.fullName ?? "—"}
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
                      current={trip.horsePlate ?? trip.truck?.plateNumber ?? "—"}
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
                  </div>
                </details>
              </Card>

              <Card className="overflow-hidden p-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800/50">
                    Registar marco operacional
                    <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-slate-200 p-5 dark:border-slate-800">
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                      Registe uma ocorrência que altera a etapa atual da viagem.
                    </p>
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
                  </div>
                </details>
              </Card>
          </div>
        ) : null}
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
      <PrintShipmentDocument
        title="Ficha operacional da viagem"
        reference={trip.cargo.code}
        status={tripStatusMeta[trip.currentStatus].label}
        route={`${trip.cargo.origin} → ${trip.cargo.destination}`}
        sections={[
          {
            title: "Carga e equipamento",
            rows: [
              { label: "Carga", value: trip.cargo.code },
              { label: "Tonelagem", value: trip.tonnage ? `${trip.tonnage} t` : "—" },
              { label: "Horse", value: trip.horsePlate ?? trip.truck?.plateNumber ?? "—" },
              { label: "Trailer", value: trip.trailer?.plateNumber ?? "—" },
              { label: "Motorista", value: trip.driverName ?? trip.driver?.fullName ?? "—" },
              { label: "Passaporte", value: trip.driverPassport ?? trip.driver?.passportNumber ?? "—" },
            ],
          },
          {
            title: "Operação",
            rows: [
              { label: "Posição atual", value: trip.currentPosition ?? "—" },
              { label: "Data de carga", value: formatDate(trip.loadedDate) },
              { label: "Data de saída", value: formatDate(trip.departureDate) },
              { label: "Data de chegada", value: formatDate(trip.arrivalDate) },
              { label: "Borders (Fronteiras)", value: trip.borders.map((item) => item.border.name).join(" › ") || "—" },
            ],
          },
        ]}
        events={events.map((event) => ({
          date: formatDateTime(event.occurredAt),
          description: event.toStatus ? tripStatusMeta[event.toStatus].label : tripEventTypeLabel[event.type],
          note: event.note ?? undefined,
        }))}
        signatures={["Responsável de operações", "Motorista", "Recebedor / Cliente"]}
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
