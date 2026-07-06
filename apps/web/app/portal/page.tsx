import { PortalShipmentsView } from "@/src/shared/components/portal-shipments-view";
import { PortalShell } from "@/src/shared/layout/portal-shell";

export default function PortalPage() {
  return (
    <PortalShell>
      <PortalShipmentsView />
    </PortalShell>
  );
}
