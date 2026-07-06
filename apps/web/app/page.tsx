import { DashboardView } from "@/src/shared/components/dashboard-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export default function DashboardPage() {
  return (
    <ProtectedLayout>
      <DashboardView />
    </ProtectedLayout>
  );
}
