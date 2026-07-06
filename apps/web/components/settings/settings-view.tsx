"use client";

import {
  Bell,
  Building2,
  type LucideIcon,
  Map,
  Plug,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { UsersPanel } from "@/components/settings/users-panel";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/utils/cn";
import { roleCatalog, roleLabelMap, roleToneMap } from "@/utils/role-permissions";

type TabId =
  | "empresa"
  | "utilizadores"
  | "perfis"
  | "integracoes"
  | "mapas"
  | "notificacoes";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "utilizadores", label: "Utilizadores", icon: Users },
  { id: "perfis", label: "Perfis & Permissões", icon: ShieldCheck },
  { id: "integracoes", label: "Integrações", icon: Plug },
  { id: "mapas", label: "Mapas", icon: Map },
  { id: "notificacoes", label: "Notificações", icon: Bell },
];

export function SettingsView() {
  const [active, setActive] = useState<TabId>("empresa");

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Preferências da empresa, utilizadores, perfis, integrações, mapas e notificações."
      />

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {active === "empresa" ? <EmpresaPanel /> : null}
        {active === "utilizadores" ? <UsersPanel /> : null}
        {active === "perfis" ? <PermissionsPanel /> : null}
        {active === "integracoes" ? <IntegrationsPanel /> : null}
        {active === "mapas" ? <MapsPanel /> : null}
        {active === "notificacoes" ? <NotificationsPanel /> : null}
      </div>
    </>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">
        {value}
      </dd>
    </div>
  );
}

function StatusItem({
  label,
  description,
  tone,
  status,
}: {
  label: string;
  description: string;
  tone: BadgeTone;
  status: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-slate-200 p-4 dark:border-slate-800">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      <Badge tone={tone}>{status}</Badge>
    </div>
  );
}

function EmpresaPanel() {
  return (
    <Panel
      title="Dados da empresa"
      description="Informação institucional (edição disponível numa próxima etapa)."
    >
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoRow label="Nome" value="SGRTC" />
        <InfoRow
          label="Designação"
          value="Sistema de Gestão e Rastreamento de Transporte de Cargas"
        />
        <InfoRow label="País" value="Moçambique" />
        <InfoRow label="Moeda" value="Metical (MZN)" />
      </dl>
    </Panel>
  );
}

function PermissionsPanel() {
  return (
    <Panel
      title="Perfis & Permissões"
      description="Perfis de acesso e respetivas permissões (definidos no backend)."
    >
      <div className="flex flex-col gap-4">
        {roleCatalog.map((role) => (
          <div
            key={role.name}
            className="rounded-md border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex items-center gap-2">
              <Badge tone={roleToneMap[role.name] ?? "slate"}>
                {roleLabelMap[role.name] ?? role.name}
              </Badge>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {role.description}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {role.permissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function IntegrationsPanel() {
  return (
    <Panel
      title="Integrações"
      description="Estado das integrações do sistema."
    >
      <div className="flex flex-col gap-3">
        <StatusItem
          label="Tempo real (WebSocket)"
          description="Eventos de rastreamento, estado de cargas e notificações."
          tone="green"
          status="Ativo"
        />
        <StatusItem
          label="Rastreamento GPS"
          description="Receção de posições enviadas pela app do motorista."
          tone="green"
          status="Ativo"
        />
        <StatusItem
          label="Email / SMS"
          description="Envio de notificações por email ou SMS."
          tone="amber"
          status="Planeado"
        />
      </div>
    </Panel>
  );
}

function MapsPanel() {
  return (
    <Panel
      title="Mapas"
      description="Provedor de mapas usado no rastreamento."
    >
      <div className="flex flex-col gap-3">
        <StatusItem
          label="OpenStreetMap (via Leaflet)"
          description="Provedor atual — gratuito e sem chave de API."
          tone="green"
          status="Ativo"
        />
        <StatusItem
          label="Google Maps / MapLibre"
          description="A abstração do mapa permite trocar de provedor no futuro."
          tone="slate"
          status="Disponível"
        />
      </div>
    </Panel>
  );
}

function NotificationsPanel() {
  return (
    <Panel
      title="Notificações"
      description="Canais de notificação do sistema."
    >
      <div className="flex flex-col gap-3">
        <StatusItem
          label="Notificações na aplicação"
          description="Recebidas no painel e marcadas como lidas."
          tone="green"
          status="Ativo"
        />
        <StatusItem
          label="WebSocket (tempo real)"
          description="Entrega imediata de novos eventos."
          tone="green"
          status="Ativo"
        />
        <StatusItem
          label="Push (app do motorista)"
          description="Notificações push no dispositivo do motorista."
          tone="amber"
          status="Planeado"
        />
        <StatusItem
          label="Email / SMS"
          description="Canais externos para fases futuras."
          tone="slate"
          status="Futuro"
        />
      </div>
    </Panel>
  );
}
