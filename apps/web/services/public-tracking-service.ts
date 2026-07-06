import { http } from "@/services/http";
import type { PublicShipment } from "@/types/public-tracking";

export async function trackShipment(token: string): Promise<PublicShipment> {
  const { data } = await http.get<PublicShipment>(`/public/track/${token}`);

  return data;
}
