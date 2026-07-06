import { TrackingView } from "@/src/shared/components/tracking-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export default function RastreamentoPage() {
  return (
    <ProtectedLayout>
      <TrackingView />
    </ProtectedLayout>
  );
}
