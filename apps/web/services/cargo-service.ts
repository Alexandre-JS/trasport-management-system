import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type {
  Cargo,
  CreateCargoPayload,
  ListCargoParams,
  UpdateCargoPayload,
} from "@/types/cargo";
import { cleanParams } from "@/utils/query-params";

export async function listCargo(
  params: ListCargoParams,
): Promise<Paginated<Cargo>> {
  const { data } = await http.get<Paginated<Cargo>>("/cargo", {
    params: cleanParams(params),
  });

  return data;
}

export async function getCargo(id: string): Promise<Cargo> {
  const { data } = await http.get<Cargo>(`/cargo/${id}`);

  return data;
}

export async function createCargo(payload: CreateCargoPayload): Promise<Cargo> {
  const { data } = await http.post<Cargo>("/cargo", payload);

  return data;
}

export async function updateCargo(
  id: string,
  payload: UpdateCargoPayload,
): Promise<Cargo> {
  const { data } = await http.patch<Cargo>(`/cargo/${id}`, payload);

  return data;
}

export async function cancelCargo(id: string): Promise<Cargo> {
  const { data } = await http.patch<Cargo>(`/cargo/${id}/cancel`);

  return data;
}

export async function deleteCargo(id: string): Promise<void> {
  await http.delete(`/cargo/${id}`);
}
