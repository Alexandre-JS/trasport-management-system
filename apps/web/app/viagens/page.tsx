import { TripsListView } from "@/src/shared/components/trips-list-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viagens",
};

export default function ViagensPage() {
  return (
    <ProtectedLayout>
      <TripsListView />
    </ProtectedLayout>
  );
}
