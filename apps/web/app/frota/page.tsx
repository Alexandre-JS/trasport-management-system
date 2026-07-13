import {
  FleetView,
  type FleetTab,
} from "@/src/shared/components/fleet-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frota",
};

type FleetPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeTab(value: string | undefined): FleetTab {
  if (value === "reboques") {
    return "reboques";
  }

  return "camioes";
}

export default async function FleetPage({ searchParams }: FleetPageProps) {
  const params = searchParams ? await searchParams : {};
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  return (
    <ProtectedLayout>
      <FleetView initialTab={normalizeTab(tab)} />
    </ProtectedLayout>
  );
}
