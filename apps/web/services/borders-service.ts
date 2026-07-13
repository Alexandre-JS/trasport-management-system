import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type { Border, BorderInput, ListBordersParams } from "@/types/border";
import { cleanParams } from "@/utils/query-params";

export async function createBorder(payload: BorderInput): Promise<Border> {
  const { data } = await http.post<Border>("/borders", payload);

  return data;
}

export async function updateBorder(
  id: string,
  payload: BorderInput,
): Promise<Border> {
  const { data } = await http.patch<Border>(`/borders/${id}`, payload);

  return data;
}

export async function listBorders(
  params: ListBordersParams,
): Promise<Paginated<Border>> {
  const { data } = await http.get<Paginated<Border>>("/borders", {
    params: cleanParams(params),
  });

  return data;
}

export async function getBorder(id: string): Promise<Border> {
  const { data } = await http.get<Border>(`/borders/${id}`);

  return data;
}

export async function deleteBorder(id: string): Promise<void> {
  await http.delete(`/borders/${id}`);
}
