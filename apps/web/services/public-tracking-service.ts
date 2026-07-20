import { http } from "@/services/http";
import type {
  PublicClientShipments,
  PublicShipment,
} from "@/types/public-tracking";

export async function trackShipment(token: string): Promise<PublicShipment> {
  const { data } = await http.get<PublicShipment>(`/public/track/${token}`);

  return data;
}

export async function trackClient(
  token: string,
): Promise<PublicClientShipments> {
  const { data } = await http.get<PublicClientShipments>(
    `/public/client/${token}`,
  );

  return data;
}
