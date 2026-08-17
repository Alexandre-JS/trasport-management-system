import { http } from "@/services/http";

export type DeliveryRecord = {
  id: string;
  tripId: string;
  podDocument: string | null;
  deliveredAt: string | null;
  updatedAt: string;
};

export async function getDeliveryByTrip(
  tripId: string,
): Promise<DeliveryRecord | null> {
  const { data } = await http.get<DeliveryRecord | null>(
    `/delivery/trips/${tripId}`,
  );
  return data;
}

export async function attachDeliveryPod(
  tripId: string,
  podDocument: string,
): Promise<DeliveryRecord> {
  const { data } = await http.post<DeliveryRecord>(
    `/delivery/trips/${tripId}/pod`,
    { podDocument },
  );
  return data;
}
