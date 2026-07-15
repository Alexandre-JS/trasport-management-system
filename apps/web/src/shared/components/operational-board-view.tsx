"use client";

import { FileSpreadsheet, Plus, Save, Sheet, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActionButton,
  PrimaryButton,
} from "@/src/shared/components/action-button";
import { PageHeader } from "@/src/shared/components/page-header";
import { useBorders } from "@/hooks/use-borders";
import { useClients } from "@/hooks/use-clients";
import { useDrivers } from "@/hooks/use-drivers";
import { useTrailers } from "@/hooks/use-trailers";
import { useTrips } from "@/hooks/use-trips";
import { useTrucks } from "@/hooks/use-trucks";
import { useToast } from "@/providers/toast-provider";
import { createCargo, updateCargo } from "@/services/cargo-service";
import { createTrip, updateTrip } from "@/services/trips-service";
import type { Trip } from "@/types/trip";
import { exportToCsv } from "@/utils/export-csv";

type BoardRow = {
  key: string;
  tripId?: string;
  cargoId?: string;
  clientId: string;
  booking: string;
  origin: string;
  destination: string;
  transporter: string;
  subcontracted: boolean;
  horse: string;
  trailer: string;
  driver: string;
  passport: string;
  license: string;
  phone: string;
  borderId: string;
  tonnage: string;
  dispatchedBy: string;
  departureDate: string;
  arrivalDate: string;
  dischargeDate: string;
  currentPosition: string;
  remarks: string;
  dirty: boolean;
};

const EMPTY_ROWS = 5;

export function OperationalBoardView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tripsQuery = useTrips({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const clientsQuery = useClients({ limit: 100, isActive: true });
  const driversQuery = useDrivers({ limit: 100 });
  const trucksQuery = useTrucks({ limit: 100 });
  const trailersQuery = useTrailers({ limit: 100 });
  const bordersQuery = useBorders({ limit: 100, active: true });
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const clients = useMemo(
    () => clientsQuery.data?.data ?? [],
    [clientsQuery.data],
  );
  const drivers = useMemo(
    () => driversQuery.data?.data ?? [],
    [driversQuery.data],
  );
  const trucks = useMemo(
    () => trucksQuery.data?.data ?? [],
    [trucksQuery.data],
  );
  const trailers = useMemo(
    () => trailersQuery.data?.data ?? [],
    [trailersQuery.data],
  );
  const borders = useMemo(
    () => bordersQuery.data?.data ?? [],
    [bordersQuery.data],
  );

  useEffect(() => {
    if (!tripsQuery.data || initialized.current) return;
    initialized.current = true;
    const persisted = tripsQuery.data.data.map(toBoardRow);
    // A grelha mantém linhas vazias prontas para digitação, como uma folha Excel.
    setRows([
      ...persisted,
      ...Array.from({ length: EMPTY_ROWS }, () => blankRow(clients[0]?.id)),
    ]);
  }, [clients, tripsQuery.data]);

  function change(key: string, field: keyof BoardRow, value: string | boolean) {
    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, [field]: value, dirty: true } : row,
      ),
    );
  }

  function addRows(count = 5) {
    setRows((current) => [
      ...current,
      ...Array.from({ length: count }, () => blankRow(clients[0]?.id)),
    ]);
  }

  function changeDriver(key: string, value: string) {
    const match = drivers.find(
      (driver) =>
        driver.fullName.toLocaleLowerCase() === value.toLocaleLowerCase(),
    );
    setRows((current) =>
      current.map((row) =>
        row.key === key
          ? {
              ...row,
              driver: value,
              passport: match?.passportNumber ?? row.passport,
              license: match?.licenseNumber ?? row.license,
              phone: match?.phone ?? row.phone,
              dirty: true,
            }
          : row,
      ),
    );
  }

  async function saveAll() {
    const pending = rows.filter((row) => row.dirty && hasContent(row));
    if (!pending.length) return;
    setSaving(true);
    let saved = 0;
    const errors: string[] = [];
    for (const row of pending) {
      try {
        validateRow(row);
        const savedTrip = row.tripId
          ? await saveExisting(row)
          : await createFromRow(row);
        setRows((current) =>
          current.map((item) =>
            item.key === row.key
              ? {
                  ...item,
                  tripId: savedTrip.id,
                  booking: savedTrip.bookingReference ?? savedTrip.cargo.code,
                  dirty: false,
                }
              : item,
          ),
        );
        saved += 1;
      } catch (error) {
        errors.push(
          `${row.booking || "Nova linha"}: ${error instanceof Error ? error.message : "erro ao guardar"}`,
        );
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["trips"] });
    setSaving(false);
    toast({
      title: `${saved} linha${saved === 1 ? "" : "s"} guardada${saved === 1 ? "" : "s"}`,
      description: errors.length
        ? errors.slice(0, 3).join(" · ")
        : "O quadro operacional está atualizado.",
      type: errors.length ? "warning" : "success",
    });
  }

  async function saveExisting(row: BoardRow) {
    const [trip] = await Promise.all([
      updateTrip(row.tripId as string, operationalPayload(row)),
      row.cargoId
        ? updateCargo(row.cargoId, {
            clientId: row.clientId,
            origin: row.origin.trim(),
            destination: row.destination.trim(),
            weightTonnes: numberOrUndefined(row.tonnage),
          })
        : Promise.resolve(null),
    ]);
    return trip;
  }

  async function createFromRow(row: BoardRow) {
    // Recursos EXTERNOS (subcontratados) não geram cadastro: os dados vivem
    // nos campos snapshot da viagem. Só se LIGA a um registo próprio quando a
    // matrícula/carta já existe na frota — sem nunca criar registos novos.
    const existingTruck = trucks.find(
      (item) => normalize(item.plateNumber) === normalize(row.horse),
    );
    const existingTrailer = trailers.find(
      (item) => normalize(item.plateNumber) === normalize(row.trailer),
    );
    const existingDriver = drivers.find(
      (item) => normalize(item.licenseNumber) === normalize(row.license),
    );

    const cargo = await createCargo({
      clientId: row.clientId,
      origin: row.origin.trim(),
      destination: row.destination.trim(),
      description: row.booking.trim() || undefined,
      weightTonnes: numberOrUndefined(row.tonnage),
    });

    return createTrip({
      cargoId: cargo.id,
      truckId: existingTruck?.id,
      trailerId: existingTrailer?.id,
      driverId: existingDriver?.id,
      ...operationalPayload(row),
    });
  }

  function removeBlank(key: string) {
    setRows((current) =>
      current.filter((row) => row.key !== key || row.tripId),
    );
  }

  const dirtyCount = rows.filter((row) => row.dirty && hasContent(row)).length;

  function exportBoard() {
    const visible = rows.filter(hasContent);
    exportToCsv("quadro-operacional.csv", visible, [
      { header: "Booking", value: (row) => row.booking },
      { header: "Transportador", value: (row) => row.transporter },
      { header: "Horse", value: (row) => row.horse },
      { header: "Trailer", value: (row) => row.trailer },
      { header: "Motorista", value: (row) => row.driver },
      { header: "Passaporte", value: (row) => row.passport },
      { header: "Carta", value: (row) => row.license },
      { header: "Telefone", value: (row) => row.phone },
      { header: "Tonelagem", value: (row) => row.tonnage },
      { header: "Despachado por", value: (row) => row.dispatchedBy },
      { header: "Saída", value: (row) => row.departureDate },
      { header: "Chegada", value: (row) => row.arrivalDate },
      { header: "Descarga", value: (row) => row.dischargeDate },
      { header: "Posição atual", value: (row) => row.currentPosition },
      { header: "Remark", value: (row) => row.remarks },
    ]);
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <PageHeader
        title="Quadro operacional"
        description="Preencha várias viagens diretamente na grelha. Desloque horizontalmente para ver todas as colunas."
        secondaryActions={
          <div className="flex gap-2">
            <ActionButton
              icon={<FileSpreadsheet className="size-4" />}
              onClick={exportBoard}
            >
              Exportar
            </ActionButton>
            <ActionButton
              icon={<Plus className="size-4" />}
              onClick={() => addRows()}
            >
              Adicionar 5 linhas
            </ActionButton>
            <PrimaryButton
              icon={<Save className="size-4" />}
              onClick={() => void saveAll()}
              loading={saving}
              disabled={!dirtyCount}
            >
              Guardar {dirtyCount || ""}
            </PrimaryButton>
          </div>
        }
      />
      <div className="flex items-center gap-2 rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200">
        <Sheet className="size-4" aria-hidden /> Uma linha corresponde a uma
        viagem. As células azuis foram alteradas e aguardam gravação.
      </div>
      <datalist id="board-horses">
        {trucks.map((item) => (
          <option key={item.id} value={item.plateNumber} />
        ))}
      </datalist>
      <datalist id="board-trailers">
        {trailers.map((item) => (
          <option key={item.id} value={item.plateNumber} />
        ))}
      </datalist>
      <datalist id="board-drivers">
        {drivers.map((item) => (
          <option key={item.id} value={item.fullName} />
        ))}
      </datalist>
      <div className="max-h-[calc(100vh-15rem)] overflow-auto rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-[2700px] border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-30 bg-slate-100 text-left font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {HEADERS.map((header, index) => (
                <th
                  key={header}
                  className={`whitespace-nowrap border-b border-r border-slate-300 px-2 py-2 dark:border-slate-700 ${index < 2 ? `sticky z-40 bg-slate-100 dark:bg-slate-800 ${index === 0 ? "left-0 w-12" : "left-12"}` : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.key}
                className={
                  row.dirty
                    ? "bg-brand-50/70 dark:bg-brand-950/20"
                    : "odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/70"
                }
              >
                <Cell
                  sticky="left-0 w-12"
                  className="text-center font-semibold"
                >
                  {index + 1}
                </Cell>
                <Cell sticky="left-12 min-w-36">
                  <Input
                    value={row.booking}
                    onChange={(v) => change(row.key, "booking", v)}
                    placeholder="Automático"
                  />
                </Cell>
                <Cell>
                  <Select
                    value={row.clientId}
                    onChange={(v) => change(row.key, "clientId", v)}
                    options={clients.map((item) => [item.id, item.companyName])}
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.origin}
                    onChange={(v) => change(row.key, "origin", v)}
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.destination}
                    onChange={(v) => change(row.key, "destination", v)}
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.transporter}
                    onChange={(v) => change(row.key, "transporter", v)}
                  />
                </Cell>
                <Cell className="text-center">
                  <input
                    type="checkbox"
                    checked={row.subcontracted}
                    onChange={(e) =>
                      change(row.key, "subcontracted", e.target.checked)
                    }
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.horse}
                    onChange={(v) => change(row.key, "horse", v)}
                    list="board-horses"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.trailer}
                    onChange={(v) => change(row.key, "trailer", v)}
                    list="board-trailers"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.driver}
                    onChange={(v) => changeDriver(row.key, v)}
                    list="board-drivers"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.passport}
                    onChange={(v) => change(row.key, "passport", v)}
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.license}
                    onChange={(v) => change(row.key, "license", v)}
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.phone}
                    onChange={(v) => change(row.key, "phone", v)}
                  />
                </Cell>
                <Cell>
                  <Select
                    value={row.borderId}
                    onChange={(v) => change(row.key, "borderId", v)}
                    options={borders.map((item) => [item.id, item.name])}
                    empty="—"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.tonnage}
                    onChange={(v) => change(row.key, "tonnage", v)}
                    type="number"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.dispatchedBy}
                    onChange={(v) => change(row.key, "dispatchedBy", v)}
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.departureDate}
                    onChange={(v) => change(row.key, "departureDate", v)}
                    type="date"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.arrivalDate}
                    onChange={(v) => change(row.key, "arrivalDate", v)}
                    type="date"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.dischargeDate}
                    onChange={(v) => change(row.key, "dischargeDate", v)}
                    type="date"
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.currentPosition}
                    onChange={(v) => change(row.key, "currentPosition", v)}
                  />
                </Cell>
                <Cell>
                  <Input
                    value={row.remarks}
                    onChange={(v) => change(row.key, "remarks", v)}
                  />
                </Cell>
                <Cell className="text-center">
                  {!row.tripId ? (
                    <button
                      type="button"
                      onClick={() => removeBlank(row.key)}
                      title="Remover linha"
                    >
                      <Trash2 className="mx-auto size-4 text-slate-400 hover:text-rose-600" />
                    </button>
                  ) : (
                    <span className="text-emerald-600">Guardado</span>
                  )}
                </Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const HEADERS = [
  "#",
  "Booking",
  "Cliente",
  "Origem",
  "Destino",
  "Transportador",
  "Subcontr.",
  "Horse",
  "Trailer",
  "Motorista",
  "Passaporte",
  "Carta",
  "Telefone",
  "Border",
  "Ton.",
  "Despachado por",
  "Saída",
  "Chegada",
  "Descarga",
  "Posição atual",
  "Remark",
  "Estado",
];

function operationalPayload(row: BoardRow) {
  return {
    transporterName: row.transporter.trim() || undefined,
    isSubcontracted: row.subcontracted,
    horsePlate: row.horse.trim() || undefined,
    trailerPlate: row.trailer.trim() || undefined,
    driverName: row.driver.trim() || undefined,
    driverPassport: row.passport.trim() || undefined,
    driverLicense: row.license.trim() || undefined,
    driverPhone: row.phone.trim() || undefined,
    bookingReference: row.booking.trim() || undefined,
    borderIds: row.borderId ? [row.borderId] : undefined,
    tonnage: numberOrUndefined(row.tonnage),
    dispatchedBy: row.dispatchedBy.trim() || undefined,
    departureDate: row.departureDate || undefined,
    arrivalDate: row.arrivalDate || undefined,
    dischargeDate: row.dischargeDate || undefined,
    currentPosition: row.currentPosition.trim() || undefined,
    remarks: row.remarks.trim() || undefined,
  };
}

function toBoardRow(trip: Trip): BoardRow {
  return {
    key: trip.id,
    tripId: trip.id,
    cargoId: trip.cargo.id,
    clientId: trip.cargo.clientId,
    booking: trip.bookingReference ?? trip.cargo.code,
    origin: trip.cargo.origin,
    destination: trip.cargo.destination,
    transporter: trip.transporterName ?? "",
    subcontracted: trip.isSubcontracted,
    horse: trip.horsePlate ?? trip.truck?.plateNumber ?? "",
    trailer: trip.trailerPlate ?? trip.trailer?.plateNumber ?? "",
    driver: trip.driverName ?? trip.driver?.fullName ?? "",
    passport: trip.driverPassport ?? trip.driver?.passportNumber ?? "",
    license: trip.driverLicense ?? trip.driver?.licenseNumber ?? "",
    phone: trip.driverPhone ?? "",
    borderId: trip.borders[0]?.border.id ?? "",
    tonnage: trip.tonnage ?? "",
    dispatchedBy: trip.dispatchedBy ?? "",
    departureDate: dateInput(trip.departureDate),
    arrivalDate: dateInput(trip.arrivalDate),
    dischargeDate: dateInput(trip.dischargeDate),
    currentPosition: trip.currentPosition ?? "",
    remarks: trip.remarks ?? "",
    dirty: false,
  };
}

function blankRow(clientId = ""): BoardRow {
  return {
    key: crypto.randomUUID(),
    clientId,
    booking: "",
    origin: "",
    destination: "",
    transporter: "LUMAC",
    subcontracted: false,
    horse: "",
    trailer: "",
    driver: "",
    passport: "",
    license: "",
    phone: "",
    borderId: "",
    tonnage: "",
    dispatchedBy: "",
    departureDate: "",
    arrivalDate: "",
    dischargeDate: "",
    currentPosition: "",
    remarks: "",
    dirty: false,
  };
}
function hasContent(row: BoardRow) {
  return Boolean(
    row.tripId || row.origin || row.destination || row.horse || row.driver,
  );
}
function validateRow(row: BoardRow) {
  if (
    !row.clientId ||
    !row.origin.trim() ||
    !row.destination.trim() ||
    !row.horse.trim() ||
    !row.trailer.trim() ||
    !row.driver.trim() ||
    !row.license.trim()
  )
    throw new Error(
      "preencha cliente, rota, Horse, trailer, motorista e carta",
    );
}
function normalize(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}
function numberOrUndefined(value: string) {
  const number = Number(value);
  return value && Number.isFinite(number) ? number : undefined;
}
function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function Cell({
  children,
  sticky,
  className = "",
}: {
  children: ReactNode;
  sticky?: string;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-r border-slate-200 p-1 dark:border-slate-800 ${sticky ? `sticky z-20 ${sticky} bg-inherit` : ""} ${className}`}
    >
      {children}
    </td>
  );
}
function Input({
  value,
  onChange,
  type = "text",
  list,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  list?: string;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type={type}
      list={list}
      placeholder={placeholder}
      className="h-8 min-w-28 w-full rounded-sm border border-transparent bg-transparent px-2 outline-none hover:border-slate-300 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950"
    />
  );
}
function Select({
  value,
  onChange,
  options,
  empty,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  empty?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 min-w-36 w-full rounded-sm border border-transparent bg-transparent px-1 outline-none hover:border-slate-300 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-950"
    >
      {empty !== undefined ? <option value="">{empty}</option> : null}
      {options.map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  );
}
