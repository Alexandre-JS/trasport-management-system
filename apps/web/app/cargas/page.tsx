import { CargasView } from "@/src/shared/components/cargas-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export default function CargasPage() {
  return (
    <ProtectedLayout>
      <CargasView />
    </ProtectedLayout>
  );
}
