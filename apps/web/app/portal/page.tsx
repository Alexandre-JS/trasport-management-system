import { PortalShipmentsView } from "@/src/shared/components/portal-shipments-view";
import { PortalShell } from "@/src/shared/layout/portal-shell";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client portal",
};

export default function PortalPage() {
  return (
    <PortalShell>
      <PortalShipmentsView />
    </PortalShell>
  );
}
