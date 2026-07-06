"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/src/shared/components/action-button";
import { ClientFormModal } from "@/src/shared/components/client-form-modal";
import { PlaceCombobox } from "@/src/shared/components/place-combobox";
import { isKnownPlace } from "@/src/shared/data/places";
import { useCreateCargo, useUpdateCargo } from "@/hooks/use-cargo";
import { useClients } from "@/hooks/use-clients";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Cargo } from "@/types/cargo";

const EMPTY = {
  clientId: "",
  origin: "",
  destination: "",
  description: "",
  weightKg: "",
  volumeM3: "",
  pickupDate: "",
  expectedDelivery: "",
  observations: "",
};

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "text-xs font-medium text-slate-600 dark:text-slate-300";

function toDateInputValue(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

function formFromCargo(cargo: Cargo) {
  return {
    clientId: cargo.clientId,
    origin: cargo.origin,
    destination: cargo.destination,
    description: cargo.description ?? "",
    weightKg: cargo.weightKg?.toString() ?? "",
    volumeM3: cargo.volumeM3?.toString() ?? "",
    pickupDate: toDateInputValue(cargo.pickupDate),
    expectedDelivery: toDateInputValue(cargo.expectedDelivery),
    observations: cargo.observations ?? "",
  };
}

export function CargoFormModal({
  open,
  onClose,
  cargo,
}: {
  open: boolean;
  onClose: () => void;
  cargo?: Cargo | null;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(() =>
    cargo ? formFromCargo(cargo) : EMPTY,
  );
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const clients = useClients({ limit: 100, isActive: true });
  const createCargo = useCreateCargo();
  const updateCargo = useUpdateCargo();
  const isEditing = Boolean(cargo);

  if (!open) return null;

  const canSubmit =
    form.clientId &&
    isKnownPlace(form.origin) &&
    isKnownPlace(form.destination);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function close() {
    setForm(EMPTY);
    onClose();
  }

  function submit() {
    const payload = {
      clientId: form.clientId,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      description: form.description.trim() || undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      volumeM3: form.volumeM3 ? Number(form.volumeM3) : undefined,
      pickupDate: form.pickupDate || undefined,
      expectedDelivery: form.expectedDelivery || undefined,
      observations: form.observations.trim() || undefined,
    };

    if (cargo) {
      updateCargo.mutate(
        { id: cargo.id, payload },
        {
          onSuccess: () => {
            toast({ title: "Carga atualizada", type: "success" });
            close();
          },
          onError: (error) =>
            toast({
              title: "Não foi possível atualizar a carga",
              description: extractErrorMessage(error),
              type: "error",
            }),
        },
      );
      return;
    }

    createCargo.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Carga registada", type: "success" });
        close();
      },
      onError: (error) =>
        toast({
          title: "Não foi possível registar a carga",
          description: extractErrorMessage(error),
          type: "error",
        }),
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              {isEditing ? "Editar carga" : "Nova carga"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isEditing
                ? "Atualize os dados da carga antes da recolha."
                : "Registe uma carga de um cliente. O código é gerado automaticamente."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={close}
            className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Cliente</span>
            <div className="flex gap-2">
              <select
                value={form.clientId}
                onChange={(event) => set("clientId", event.target.value)}
                className={inputClass}
              >
                <option value="">Selecionar cliente…</option>
                {(clients.data?.data ?? []).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
              <SecondaryButton
                icon={<Plus className="size-4" aria-hidden />}
                onClick={() => setClientModalOpen(true)}
                className="shrink-0"
              >
                Novo
              </SecondaryButton>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Cliente não encontrado? Registe-o em Novo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Origem</span>
              <PlaceCombobox
                value={form.origin}
                onChange={(value) => set("origin", value)}
                placeholder="Ex.: Beira"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Destino</span>
              <PlaceCombobox
                value={form.destination}
                onChange={(value) => set("destination", value)}
                placeholder="Ex.: Lusaka"
              />
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Mercadoria</span>
            <input
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder="Ex.: Cobre catódico"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Peso (kg)</span>
              <input
                type="number"
                min="0"
                value={form.weightKg}
                onChange={(event) => set("weightKg", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Volume (m³)</span>
              <input
                type="number"
                min="0"
                value={form.volumeM3}
                onChange={(event) => set("volumeM3", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Data de recolha</span>
              <input
                type="date"
                value={form.pickupDate}
                onChange={(event) => set("pickupDate", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Entrega prevista</span>
              <input
                type="date"
                value={form.expectedDelivery}
                onChange={(event) =>
                  set("expectedDelivery", event.target.value)
                }
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Observações</span>
            <textarea
              value={form.observations}
              onChange={(event) => set("observations", event.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <SecondaryButton onClick={close}>Cancelar</SecondaryButton>
          <PrimaryButton
            onClick={submit}
            loading={createCargo.isPending || updateCargo.isPending}
            disabled={!canSubmit}
          >
            {isEditing ? "Guardar alterações" : "Registar carga"}
          </PrimaryButton>
        </div>
      </div>

      <ClientFormModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onCreated={(client) => {
          set("clientId", client.id);
          setClientModalOpen(false);
        }}
      />
    </div>
  );
}
