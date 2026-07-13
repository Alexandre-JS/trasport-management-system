import { TrackingView } from "@/src/shared/components/tracking-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rastreamento",
};

export default function RastreamentoPage() {
  return (
    <ProtectedLayout>
      <TrackingView />
    </ProtectedLayout>
  );
}
