import { BordersView } from "@/components/borders/borders-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fronteiras",
};

export default function FronteirasPage() {
  return (
    <ProtectedLayout>
      <BordersView />
    </ProtectedLayout>
  );
}
