import { IncidentsView } from "@/components/incidents/incidents-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export default function IncidentesPage() {
  return (
    <ProtectedLayout>
      <IncidentsView />
    </ProtectedLayout>
  );
}
