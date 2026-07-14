import { http } from "@/services/http";

export type ContainerReturn = {
  id: string;
  tripId: string;
  returnedTo: string | null;
  receiverName: string | null;
  podDocument: string | null;
  returnedAt: string | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function getContainerReturn(
  tripId: string,
): Promise<ContainerReturn | null> {
  const { data } = await http.get<ContainerReturn | null>(
    `/container-returns/${tripId}`,
  );

  return data;
}
