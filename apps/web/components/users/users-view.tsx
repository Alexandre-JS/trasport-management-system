"use client";

import { KeyRound, Users } from "lucide-react";
import { useState } from "react";
import { DriversView } from "@/components/drivers/drivers-view";
import { UsersPanel } from "@/components/settings/users-panel";
import { PageHeader } from "@/components/ui/page-header";

export function UsersView() {
  const [tab, setTab] = useState<"users" | "drivers">("users");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Management"
        description="System accounts and driver access to the mobile application."
      />

      <div className="grid gap-2 sm:max-w-2xl sm:grid-cols-2" role="tablist">
        <TabButton
          active={tab === "users"}
          icon={Users}
          title="Users"
          description="Administrators, clients, and roles"
          onClick={() => setTab("users")}
        />
        <TabButton
          active={tab === "drivers"}
          icon={KeyRound}
          title="Driver Access"
          description="Create, activate, or deactivate mobile access"
          onClick={() => setTab("drivers")}
        />
      </div>

      <section role="tabpanel">
        {tab === "users" ? <UsersPanel /> : <DriversView showHeader={false} />}
      </section>
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Users;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-start gap-3 rounded-md border p-3 text-left transition ${
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
      }`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span
          className={`mt-1 block text-xs ${active ? "text-brand-50" : "text-slate-500 dark:text-slate-400"}`}
        >
          {description}
        </span>
      </span>
    </button>
  );
}
