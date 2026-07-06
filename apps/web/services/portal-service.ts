import { http } from "@/services/http";
import type { PortalShipment, PortalShipmentDetail } from "@/types/portal";

export async function listMyShipments(): Promise<PortalShipment[]> {
  const { data } = await http.get<PortalShipment[]>("/portal/trips");

  return data;
}

export async function getMyShipment(id: string): Promise<PortalShipmentDetail> {
  const { data } = await http.get<PortalShipmentDetail>(`/portal/trips/${id}`);

  return data;
}
