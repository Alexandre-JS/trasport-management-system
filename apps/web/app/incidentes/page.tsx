import { IncidentsView } from "@/components/incidents/incidents-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incidentes",
};

export default function IncidentesPage() {
  return (
    <ProtectedLayout>
      <IncidentsView />
    </ProtectedLayout>
  );
}
