"use client";

import { Boxes, PackagePlus, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FleetWizardModal } from "@/components/fleet/fleet-wizard-modal";
import { TrailersView } from "@/components/trailers/trailers-view";
import { TrucksView } from "@/components/trucks/trucks-view";
import { PageHeader } from "@/src/shared/components/page-header";
import { Button } from "@/components/ui/button";

export type FleetTab = "camioes" | "reboques";

type FleetViewProps = {
  initialTab: FleetTab;
};

const tabs = [
  {
    id: "camioes",
    label: "Horses",
    description: "Horses, capacidade e estado",
    icon: Truck,
  },
  {
    id: "reboques",
    label: "Trailers",
    description: "Trailers e disponibilidade",
    icon: Boxes,
  },
] satisfies Array<{
  id: FleetTab;
  label: string;
  description: string;
  icon: typeof Truck;
}>;

export function FleetView({ initialTab }: FleetViewProps) {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);

  function setTab(tab: FleetTab) {
    router.replace(`/frota?tab=${tab}`, { scroll: false });
  }

  function moveTab(currentIndex: number, direction: -1 | 1) {
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    setTab(nextTab.id);
    document.getElementById(`tab-${nextTab.id}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Frota"
        description="Gestão centralizada dos veículos, trailers e disponibilidade operacional."
        primaryAction={
          <Button
            size="sm"
            icon={<PackagePlus className="size-4" />}
            onClick={() => setWizardOpen(true)}
          >
            Registar unidade
          </Button>
        }
      />

      <FleetWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      <div className="grid gap-2 sm:grid-cols-2" role="tablist">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const active = tab.id === initialTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") moveTab(index, 1);
                if (event.key === "ArrowLeft") moveTab(index, -1);
              }}
              className={[
                "flex items-start gap-3 rounded-md border p-3 text-left transition",
                active
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm dark:border-brand-400 dark:bg-brand-500 dark:text-white"
                  : "border-brand-100 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 dark:border-brand-950 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-brand-800 dark:hover:bg-brand-950/60 dark:hover:text-brand-100",
              ].join(" ")}
            >
              <Icon
                className={[
                  "mt-0.5 size-5 shrink-0",
                  active
                    ? "text-white"
                    : "text-brand-600 dark:text-brand-300",
                ].join(" ")}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span
                  className={[
                    "mt-1 block text-xs leading-5",
                    active
                      ? "text-brand-50 dark:text-brand-50"
                      : "text-slate-500 dark:text-slate-400",
                  ].join(" ")}
                >
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <section
        id={`panel-${initialTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${initialTab}`}
      >
        {initialTab === "camioes" ? <TrucksView showHeader={false} /> : null}
        {initialTab === "reboques" ? <TrailersView /> : null}
      </section>
    </div>
  );
}
