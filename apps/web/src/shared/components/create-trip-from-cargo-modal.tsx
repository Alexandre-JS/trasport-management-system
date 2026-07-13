"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/src/shared/components/action-button";
import { Modal } from "@/components/ui/modal";
import { useBorders } from "@/hooks/use-borders";
import { useDrivers } from "@/hooks/use-drivers";
import { useCreateTrip, useTrips } from "@/hooks/use-trips";
import { useTrailers } from "@/hooks/use-trailers";
import { useTrucks } from "@/hooks/use-trucks";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Cargo } from "@/types/cargo";
import type { Trip } from "@/types/trip";
import { formatWeight } from "@/utils/format";
import { isTerminalTripStatus } from "@/utils/trip-status";

type CreateTripFromCargoModalProps = {
  open: boolean;
  cargo: Cargo | null;
  onClose: () => void;
};

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "text-xs font-medium text-slate-600 dark:text-slate-300";

function toIsoDateTime(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

export function CreateTripFromCargoModal({
  open,
  cargo,
  onClose,
}: CreateTripFromCargoModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [driverId, setDriverId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [borderIds, setBorderIds] = useState<string[]>([]);
  const [departureDate, setDepartureDate] = useState("");
  const [arrivalEstimate, setArrivalEstimate] = useState("");

  const drivers = useDrivers({
    limit: 100,
    status: "AVAILABLE",
    sortBy: "fullName",
    sortOrder: "asc",
  });
  const trucks = useTrucks({
    limit: 100,
    status: "AVAILABLE",
    sortBy: "plateNumber",
    sortOrder: "asc",
  });
  const trailers = useTrailers({
    limit: 100,
    status: "AVAILABLE",
    sortBy: "plateNumber",
    sortOrder: "asc",
  });
  const borders = useBorders({
    limit: 100,
    active: true,
    sortBy: "name",
    sortOrder: "asc",
  });
  const existingTrips = useTrips(
    {
      page: 1,
      limit: 10,
      cargoId: cargo?.id,
    },
    { enabled: open && cargo !== null },
  );
  const createTrip = useCreateTrip();

  const activeTrip = useMemo<Trip | null>(() => {
    return (
      existingTrips.data?.data.find(
        (trip) => !isTerminalTripStatus(trip.currentStatus),
      ) ?? null
    );
  }, [existingTrips.data?.data]);

  const compatibleTrailers = useMemo(() => {
    const allTrailers = trailers.data?.data ?? [];

    if (!truckId) {
      return allTrailers;
    }

    return allTrailers.filter(
      (trailer) => !trailer.truck || trailer.truck.id === truckId,
    );
  }, [trailers.data?.data, truckId]);

  const allBorders = borders.data?.data ?? [];
  const borderNameById = new Map(allBorders.map((b) => [b.id, b.name]));
  const availableBorders = allBorders.filter(
    (border) => !borderIds.includes(border.id),
  );

  if (!open || !cargo) {
    return null;
  }

  const selectedCargo = cargo;
  const canSubmit =
    driverId && truckId && trailerId && !activeTrip && !createTrip.isPending;

  function close() {
    setDriverId("");
    setTruckId("");
    setTrailerId("");
    setBorderIds([]);
    setDepartureDate("");
    setArrivalEstimate("");
    onClose();
  }

  function submit() {
    if (!canSubmit) {
      return;
    }

    createTrip.mutate(
      {
        cargoId: selectedCargo.id,
        driverId,
        truckId,
        trailerId,
        borderIds: borderIds.length > 0 ? borderIds : undefined,
        departureDate: toIsoDateTime(departureDate),
        arrivalEstimate: toIsoDateTime(arrivalEstimate),
      },
      {
        onSuccess: (trip) => {
          toast({ title: "Viagem criada", type: "success" });
          close();
          router.push(`/viagens/${trip.id}`);
        },
        onError: (error) =>
          toast({
            title: "Não foi possível criar a viagem",
            description: extractErrorMessage(error),
            type: "error",
          }),
      },
    );
  }

  return (
    <Modal
      open={open}
      title="Criar viagem"
      description={`${cargo.code} · ${cargo.origin} → ${cargo.destination}`}
      onClose={close}
      size="lg"
      footer={
        <>
          <SecondaryButton onClick={close}>Voltar</SecondaryButton>
          <PrimaryButton
            onClick={submit}
            loading={createTrip.isPending}
            disabled={!canSubmit}
          >
            Criar viagem
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 rounded-md border border-brand-100 bg-brand-50 p-3 text-sm dark:border-brand-900 dark:bg-brand-950/40 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-brand-700 dark:text-brand-200">
              Cliente
            </p>
            <p className="mt-1 truncate text-slate-900 dark:text-slate-100">
              {cargo.client.companyName}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-brand-700 dark:text-brand-200">
              Peso
            </p>
            <p className="mt-1 text-slate-900 dark:text-slate-100">
              {formatWeight(cargo.weightKg)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-brand-700 dark:text-brand-200">
              Mercadoria
            </p>
            <p className="mt-1 truncate text-slate-900 dark:text-slate-100">
              {cargo.description || "—"}
            </p>
          </div>
        </div>

        {activeTrip ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Esta carga já tem uma viagem ativa. Abra a viagem existente para
            continuar o acompanhamento.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Motorista</span>
            <select
              value={driverId}
              onChange={(event) => setDriverId(event.target.value)}
              className={inputClass}
            >
              <option value="">Selecionar motorista…</option>
              {(drivers.data?.data ?? []).map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName} · {driver.licenseNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Horse</span>
            <select
              value={truckId}
              onChange={(event) => {
                setTruckId(event.target.value);
                setTrailerId("");
              }}
              className={inputClass}
            >
              <option value="">Selecionar horse…</option>
              {(trucks.data?.data ?? []).map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {truck.plateNumber}
                  {truck.brand ? ` · ${truck.brand}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Trailer</span>
            <select
              value={trailerId}
              onChange={(event) => setTrailerId(event.target.value)}
              className={inputClass}
            >
              <option value="">Selecionar trailer…</option>
              {compatibleTrailers.map((trailer) => (
                <option key={trailer.id} value={trailer.id}>
                  {trailer.plateNumber}
                  {trailer.tonnage ? ` · ${trailer.tonnage} t` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>
              Fronteiras da rota (por ordem de travessia)
            </span>
            <select
              value=""
              onChange={(event) => {
                const id = event.target.value;
                if (id) {
                  setBorderIds((current) => [...current, id]);
                }
              }}
              className={inputClass}
            >
              <option value="">Adicionar fronteira…</option>
              {availableBorders.map((border) => (
                <option key={border.id} value={border.id}>
                  {border.name} · {border.countryA} — {border.countryB}
                </option>
              ))}
            </select>
            {borderIds.length > 0 ? (
              <ol className="mt-1 flex flex-wrap gap-2">
                {borderIds.map((id, index) => (
                  <li
                    key={id}
                    className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <span>
                      {index + 1}. {borderNameById.get(id) ?? id}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remover ${borderNameById.get(id) ?? "fronteira"}`}
                      onClick={() =>
                        setBorderIds((current) =>
                          current.filter((value) => value !== id),
                        )
                      }
                      className="text-slate-400 transition hover:text-rose-500"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Saída prevista</span>
            <input
              type="datetime-local"
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Chegada estimada</span>
            <input
              type="datetime-local"
              value={arrivalEstimate}
              onChange={(event) => setArrivalEstimate(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}
