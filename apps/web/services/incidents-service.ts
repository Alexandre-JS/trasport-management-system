import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type { Incident, ListIncidentsParams } from "@/types/incident";
import { cleanParams } from "@/utils/query-params";

export async function listIncidents(
  params: ListIncidentsParams,
): Promise<Paginated<Incident>> {
  const { data } = await http.get<Paginated<Incident>>("/incidents", {
    params: cleanParams(params),
  });

  return data;
}

export async function resolveIncident(id: string): Promise<Incident> {
  const { data } = await http.patch<Incident>(`/incidents/${id}/resolve`);

  return data;
}

export async function deleteIncident(id: string): Promise<void> {
  await http.delete(`/incidents/${id}`);
}
