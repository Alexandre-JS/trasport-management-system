import { PortalShipmentDetail } from "@/src/shared/components/portal-shipment-detail";
import { PortalShell } from "@/src/shared/layout/portal-shell";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detalhe da carga",
};

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
