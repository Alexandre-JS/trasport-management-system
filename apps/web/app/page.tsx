import { OperationalBoardView } from "@/src/shared/components/operational-board-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export default function OperationalBoardPage() {
  return (
    <ProtectedLayout>
      <OperationalBoardView />
    </ProtectedLayout>
  );
}
