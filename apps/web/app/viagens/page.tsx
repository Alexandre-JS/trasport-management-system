import { TripsListView } from "@/src/shared/components/trips-list-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export default function ViagensPage() {
  return (
    <ProtectedLayout>
      <TripsListView />
    </ProtectedLayout>
  );
}
