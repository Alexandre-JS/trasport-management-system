"use client";

import { useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/src/shared/components/action-button";
import { Modal } from "@/components/ui/modal";
import { useUpdateTrip } from "@/hooks/use-trips";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Trip } from "@/types/trip";

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "text-xs font-medium text-slate-600 dark:text-slate-300";

type EditTripModalProps = {
  trip: Trip | null;
  onClose: () => void;
  onSaved?: () => void;
};

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function toIsoDateTime(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

function buildForm(trip: Trip | null) {
  return {
    bookingReference: trip?.bookingReference ?? "",
    horsePlate: trip?.horsePlate ?? "",
    trailerPlate: trip?.trailerPlate ?? "",
    driverName: trip?.driverName ?? "",
    driverPhone: trip?.driverPhone ?? "",
    driverLicense: trip?.driverLicense ?? "",
    transporterName: trip?.transporterName ?? "",
    dispatchedBy: trip?.dispatchedBy ?? "",
    tonnage: trip?.tonnage ?? "",
    departureDate: toDateInput(trip?.departureDate ?? null),
    arrivalDate: toDateInput(trip?.arrivalDate ?? null),
    dischargeDate: toDateInput(trip?.dischargeDate ?? null),
    currentPosition: trip?.currentPosition ?? "",
    remarks: trip?.remarks ?? "",
  };
}

// Edita os campos da folha (linguagem do quadro). Recursos subcontratados
// vivem nos campos snapshot; não mexemos aqui em vínculos a recursos próprios.
// O pai passa key={trip.id} para o estado inicial ser derivado do trip aberto.
export function EditTripModal({ trip, onClose, onSaved }: EditTripModalProps) {
  const { toast } = useToast();
  const updateTrip = useUpdateTrip();

  const [form, setForm] = useState(() => buildForm(trip));

  if (!trip) return null;

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const trimmedOrUndefined = (value: string) => {
    const v = value.trim();
    return v ? v : undefined;
  };

  function submit() {
    if (!trip) return;
    const tonnageNumber = form.tonnage.trim()
      ? Number(form.tonnage.replace(",", "."))
      : undefined;
    if (tonnageNumber !== undefined && Number.isNaN(tonnageNumber)) {
      toast({ title: "Tonelagem inválida", type: "error" });
      return;
    }

    updateTrip.mutate(
      {
        id: trip.id,
        payload: {
          bookingReference: trimmedOrUndefined(form.bookingReference),
          horsePlate: trimmedOrUndefined(form.horsePlate),
          trailerPlate: trimmedOrUndefined(form.trailerPlate),
          driverName: trimmedOrUndefined(form.driverName),
          driverPhone: trimmedOrUndefined(form.driverPhone),
          driverLicense: trimmedOrUndefined(form.driverLicense),
          transporterName: trimmedOrUndefined(form.transporterName),
          dispatchedBy: trimmedOrUndefined(form.dispatchedBy),
          tonnage: tonnageNumber,
          departureDate: toIsoDateTime(form.departureDate),
          arrivalDate: toIsoDateTime(form.arrivalDate),
          dischargeDate: toIsoDateTime(form.dischargeDate),
          currentPosition: trimmedOrUndefined(form.currentPosition),
          remarks: trimmedOrUndefined(form.remarks),
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Viagem atualizada", type: "success" });
          onSaved?.();
          onClose();
        },
        onError: (error) =>
          toast({
            title: "Não foi possível guardar",
            description: extractErrorMessage(error),
            type: "error",
          }),
      },
    );
  }

  return (
    <Modal
      open={trip !== null}
      size="lg"
      title="Editar viagem"
      description={`Carga ${trip.cargo.code} · ${trip.cargo.origin} → ${trip.cargo.destination}`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <PrimaryButton onClick={submit} loading={updateTrip.isPending}>
            Guardar
          </PrimaryButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Booking / Referência">
          <input
            className={inputClass}
            value={form.bookingReference}
            onChange={(e) => set("bookingReference")(e.target.value)}
          />
        </Field>
        <Field label="Transportador">
          <input
            className={inputClass}
            value={form.transporterName}
            onChange={(e) => set("transporterName")(e.target.value)}
          />
        </Field>
        <Field label="Horse (matrícula)">
          <input
            className={inputClass}
            value={form.horsePlate}
            onChange={(e) => set("horsePlate")(e.target.value)}
          />
        </Field>
        <Field label="Trailer (matrícula)">
          <input
            className={inputClass}
            value={form.trailerPlate}
            onChange={(e) => set("trailerPlate")(e.target.value)}
          />
        </Field>
        <Field label="Nome do motorista">
          <input
            className={inputClass}
            value={form.driverName}
            onChange={(e) => set("driverName")(e.target.value)}
          />
        </Field>
        <Field label="Telefone do motorista">
          <input
            className={inputClass}
            value={form.driverPhone}
            onChange={(e) => set("driverPhone")(e.target.value)}
          />
        </Field>
        <Field label="Carta de condução">
          <input
            className={inputClass}
            value={form.driverLicense}
            onChange={(e) => set("driverLicense")(e.target.value)}
          />
        </Field>
        <Field label="Tonelagem (t)">
          <input
            className={inputClass}
            inputMode="decimal"
            value={form.tonnage}
            onChange={(e) => set("tonnage")(e.target.value)}
          />
        </Field>
        <Field label="Dispatched From">
          <input
            className={inputClass}
            value={form.dispatchedBy}
            onChange={(e) => set("dispatchedBy")(e.target.value)}
          />
        </Field>
        <Field label="Posição atual">
          <input
            className={inputClass}
            value={form.currentPosition}
            onChange={(e) => set("currentPosition")(e.target.value)}
          />
        </Field>
        <Field label="Data de saída (Dispatch)">
          <input
            type="date"
            className={inputClass}
            value={form.departureDate}
            onChange={(e) => set("departureDate")(e.target.value)}
          />
        </Field>
        <Field label="Data de chegada (Arrive)">
          <input
            type="date"
            className={inputClass}
            value={form.arrivalDate}
            onChange={(e) => set("arrivalDate")(e.target.value)}
          />
        </Field>
        <Field label="Data de descarga (Discharge)">
          <input
            type="date"
            className={inputClass}
            value={form.dischargeDate}
            onChange={(e) => set("dischargeDate")(e.target.value)}
          />
        </Field>
        <Field label="Observações (Remark)" full>
          <input
            className={inputClass}
            value={form.remarks}
            onChange={(e) => set("remarks")(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}
