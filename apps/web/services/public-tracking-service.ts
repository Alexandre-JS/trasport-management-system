import { http } from "@/services/http";
import type { PublicTrackingResult } from "@/types/public-tracking";

export async function trackPublic(token: string): Promise<PublicTrackingResult> {
  const { data } = await http.get<PublicTrackingResult>(`/public/track/${token}`);

  return data;
}
