import { CargasView } from "@/src/shared/components/cargas-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cargas",
};

export default function CargasPage() {
  return (
    <ProtectedLayout>
      <CargasView />
    </ProtectedLayout>
  );
}
