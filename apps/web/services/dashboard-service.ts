import type { DashboardMetric, RecentOperation } from "@/types/dashboard";

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  return [
    { label: "Cargas em trânsito", value: "18", tone: "blue" },
    { label: "Cargas entregues", value: "42", tone: "green" },
    { label: "Cargas pendentes", value: "9", tone: "amber" },
    { label: "Motoristas ativos", value: "24", tone: "slate" },
  ];
}

export async function getRecentOperations(): Promise<RecentOperation[]> {
  return [
    {
      id: "op-001",
      cargoCode: "SGRTC-1024",
      client: "Moz Freight",
      route: "Maputo -> Beira",
      status: "Em Trânsito",
      updatedAt: "Hoje, 09:40",
    },
    {
      id: "op-002",
      cargoCode: "SGRTC-1025",
      client: "Matola Foods",
      route: "Matola -> Nampula",
      status: "Aguardando Recolha",
      updatedAt: "Hoje, 08:15",
    },
    {
      id: "op-003",
      cargoCode: "SGRTC-1026",
      client: "Zambeze Logistics",
      route: "Tete -> Quelimane",
      status: "Entregue",
      updatedAt: "Ontem, 17:20",
    },
  ];
}
