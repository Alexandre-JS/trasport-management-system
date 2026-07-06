"use client";

import { X } from "lucide-react";
import { useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/src/shared/components/action-button";
import { useCreateClient } from "@/hooks/use-clients";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Client } from "@/types/client";

const EMPTY = {
  companyName: "",
  contactName: "",
  nuit: "",
  phone: "",
  city: "",
  country: "Moçambique",
};

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "text-xs font-medium text-slate-600 dark:text-slate-300";

export function ClientFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const createClient = useCreateClient();

  if (!open) return null;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function close() {
    setForm(EMPTY);
    onClose();
  }

  function submit() {
    createClient.mutate(
      {
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim() || undefined,
        nuit: form.nuit.trim() || undefined,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
      },
      {
        onSuccess: (client) => {
          toast({ title: "Cliente registado", type: "success" });
          setForm(EMPTY);
          onCreated(client);
        },
        onError: (error) =>
          toast({
            title: "Não foi possível registar o cliente",
            description: extractErrorMessage(error),
            type: "error",
          }),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              Novo cliente
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Registe um cliente que ainda não existe.
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
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Empresa / Nome</span>
            <input
              value={form.companyName}
              onChange={(event) => set("companyName", event.target.value)}
              placeholder="Ex.: Zambia Copper Traders Ltd"
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Contacto</span>
              <input
                value={form.contactName}
                onChange={(event) => set("contactName", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>NUIT</span>
              <input
                value={form.nuit}
                onChange={(event) => set("nuit", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Telefone</span>
              <input
                value={form.phone}
                onChange={(event) => set("phone", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Cidade</span>
              <input
                value={form.city}
                onChange={(event) => set("city", event.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>País</span>
            <input
              value={form.country}
              onChange={(event) => set("country", event.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <SecondaryButton onClick={close}>Cancelar</SecondaryButton>
          <PrimaryButton
            onClick={submit}
            loading={createClient.isPending}
            disabled={!form.companyName.trim()}
          >
            Registar cliente
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
