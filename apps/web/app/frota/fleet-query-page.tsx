"use client";

import { useSearchParams } from "next/navigation";
import { FleetView, type FleetTab } from "@/src/shared/components/fleet-view";

export function FleetQueryPage() {
  const tab: FleetTab =
    useSearchParams().get("tab") === "reboques" ? "reboques" : "camioes";

  return <FleetView initialTab={tab} />;
}
