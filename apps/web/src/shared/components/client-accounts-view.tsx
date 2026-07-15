"use client";

import { useState } from "react";
import { AccessDeliveryPanel, type AccessDelivery } from "@/src/shared/components/access-delivery-panel";
import { PrimaryButton } from "@/src/shared/components/action-button";
import { Card } from "@/src/shared/components/card";
import { PageHeader } from "@/src/shared/components/page-header";
import { useClients } from "@/hooks/use-clients";
import { useCreateClientAccount } from "@/hooks/use-client-accounts";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";

const EMPTY = {
  clientId: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

function Label({
  children,
  htmlFor,
}: {
  children: string;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium text-slate-700 dark:text-slate-300"
    >
      {children}
    </label>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

type ClientAccountsViewProps = {
  showHeader?: boolean;
};

export function ClientAccountsView({
  showHeader = true,
}: ClientAccountsViewProps = {}) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [createdAccess, setCreatedAccess] = useState<AccessDelivery | null>(null);
  const clients = useClients({ limit: 100, isActive: true });
  const createAccount = useCreateClientAccount();

  const canSubmit =
    form.clientId &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 8;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    createAccount.mutate(
      {
        clientId: form.clientId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      },
      {
        onSuccess: () => {
          setCreatedAccess({
            recipientName: `${form.firstName.trim()} ${form.lastName.trim()}`,
            email: form.email.trim(),
            password: form.password,
            destinationUrl: `${window.location.origin}/login`,
            destinationLabel: "Portal do cliente",
            documentTitle: "Dados de acesso ao portal",
          });
          toast({ title: "Conta de cliente criada", type: "success" });
          setForm(EMPTY);
        },
        onError: (error) =>
          toast({
            title: "Não foi possível criar a conta",
            description: extractErrorMessage(error),
            type: "error",
          }),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {showHeader ? (
        <PageHeader
          title="Contas de cliente"
          description="Crie um acesso ao portal para um cliente acompanhar as suas cargas."
        />
      ) : null}

      <Card className="max-w-xl p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="client">Cliente</Label>
            <select
              id="client"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">Nome</Label>
              <input
                id="firstName"
                value={form.firstName}
                onChange={(event) => set("firstName", event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Apelido</Label>
              <input
                id="lastName"
                value={form.lastName}
                onChange={(event) => set("lastName", event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
              placeholder="contacto@cliente.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Palavra-passe inicial</Label>
            <input
              id="password"
              type="text"
              value={form.password}
              onChange={(event) => set("password", event.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={inputClass}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              O cliente pode alterá-la depois no perfil.
            </p>
          </div>

          <div className="pt-1">
            <PrimaryButton
              onClick={submit}
              loading={createAccount.isPending}
              disabled={!canSubmit}
            >
              Criar conta de acesso
            </PrimaryButton>
          </div>
        </div>
      </Card>
      {createdAccess ? (
        <div className="max-w-3xl">
          <AccessDeliveryPanel access={createdAccess} />
        </div>
      ) : null}
    </div>
  );
}
