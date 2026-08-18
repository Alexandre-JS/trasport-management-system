import { StaticTripsRoute } from "./static-trips-route";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activities",
};

// Rota /viagens reaproveitada como página de Atividades (acompanhamento das
// folhas). A antiga lista de viagens (TripsListView) fica no código.
export default function AtividadesPage() {
  return <StaticTripsRoute />;
}
