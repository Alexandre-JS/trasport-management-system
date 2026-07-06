import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type {
  ListTrucksParams,
  Truck,
  TruckInput,
  TruckStatusAction,
} from "@/types/truck";
import { cleanParams } from "@/utils/query-params";

export async function createTruck(payload: TruckInput): Promise<Truck> {
  const { data } = await http.post<Truck>("/trucks", payload);

  return data;
}

export async function updateTruck(
  id: string,
  payload: TruckInput,
): Promise<Truck> {
  const { data } = await http.patch<Truck>(`/trucks/${id}`, payload);

  return data;
}

export async function listTrucks(
  params: ListTrucksParams,
): Promise<Paginated<Truck>> {
  const { data } = await http.get<Paginated<Truck>>("/trucks", {
    params: cleanParams(params),
  });

  return data;
}

export async function getTruck(id: string): Promise<Truck> {
  const { data } = await http.get<Truck>(`/trucks/${id}`);

  return data;
}

export async function deleteTruck(id: string): Promise<void> {
  await http.delete(`/trucks/${id}`);
}

export async function updateTruckStatus(
  id: string,
  action: TruckStatusAction,
): Promise<Truck> {
  const { data } = await http.patch<Truck>(`/trucks/${id}/${action}`);

  return data;
}
