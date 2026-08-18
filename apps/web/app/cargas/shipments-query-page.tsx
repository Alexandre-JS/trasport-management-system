"use client";

import { useSearchParams } from "next/navigation";
import { CargasView } from "@/src/shared/components/cargas-view";

export function ShipmentsQueryPage() {
  const params = useSearchParams();

  return (
    <CargasView
      initialSearch={params.get("q") ?? ""}
      initialClientId={params.get("client") ?? "all"}
      initialStatus={params.get("status") ?? "all"}
      initialPage={Number(params.get("page")) || 1}
      initialCreateOpen={params.get("action") === "new"}
    />
  );
}
