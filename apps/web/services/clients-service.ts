import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type { Client, ClientInput, ListClientsParams } from "@/types/client";
import { cleanParams } from "@/utils/query-params";

export async function createClient(payload: ClientInput): Promise<Client> {
  const { data } = await http.post<Client>("/clients", payload);

  return data;
}

export async function updateClient(
  id: string,
  payload: ClientInput,
): Promise<Client> {
  const { data } = await http.patch<Client>(`/clients/${id}`, payload);

  return data;
}

export async function listClients(
  params: ListClientsParams,
): Promise<Paginated<Client>> {
  const { data } = await http.get<Paginated<Client>>("/clients", {
    params: cleanParams(params),
  });

  return data;
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await http.get<Client>(`/clients/${id}`);

  return data;
}

export async function deleteClient(id: string): Promise<void> {
  await http.delete(`/clients/${id}`);
}

export async function setClientActive(
  id: string,
  active: boolean,
): Promise<Client> {
  const { data } = await http.patch<Client>(
    `/clients/${id}/${active ? "activate" : "deactivate"}`,
  );

  return data;
}
