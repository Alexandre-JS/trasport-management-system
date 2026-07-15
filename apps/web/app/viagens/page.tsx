import { ActivitiesView } from "@/src/shared/components/activities-view";
import { ProtectedLayout } from "@/src/shared/layout/protected-layout";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atividades",
};

// Rota /viagens reaproveitada como página de Atividades (acompanhamento das
// folhas). A antiga lista de viagens (TripsListView) fica no código.
export default function AtividadesPage() {
  return (
    <ProtectedLayout>
      <ActivitiesView />
    </ProtectedLayout>
  );
}
