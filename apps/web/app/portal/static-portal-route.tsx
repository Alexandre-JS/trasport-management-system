"use client";

import { usePathname } from "next/navigation";
import { PortalShipmentDetail } from "@/src/shared/components/portal-shipment-detail";
import { PortalShipmentsView } from "@/src/shared/components/portal-shipments-view";
import { PortalShell } from "@/src/shared/layout/portal-shell";

export function StaticPortalRoute() {
  const id = childSegment(usePathname(), "portal");

  return (
    <PortalShell>
      {id ? <PortalShipmentDetail id={id} /> : <PortalShipmentsView />}
    </PortalShell>
  );
}

function childSegment(pathname: string, root: string) {
  const parts = pathname.split("/").filter(Boolean);
  const rootIndex = parts.indexOf(root);
  const value = rootIndex >= 0 ? parts[rootIndex + 1] : undefined;
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
