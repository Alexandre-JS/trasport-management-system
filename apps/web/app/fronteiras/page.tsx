import { BordersView } from "@/components/borders/borders-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

export default function FronteirasPage() {
  return (
    <ProtectedLayout>
      <BordersView />
    </ProtectedLayout>
  );
}
