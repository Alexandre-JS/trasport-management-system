import { PortalShipmentDetail } from "@/src/shared/components/portal-shipment-detail";
import { PortalShell } from "@/src/shared/layout/portal-shell";

export default async function PortalShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PortalShell>
      <PortalShipmentDetail id={id} />
    </PortalShell>
  );
}
