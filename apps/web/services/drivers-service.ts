import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type {
  Driver,
  DriverInput,
  DriverStatusAction,
  ListDriversParams,
} from "@/types/driver";
import { cleanParams } from "@/utils/query-params";

export async function createDriver(payload: DriverInput): Promise<Driver> {
  const { data } = await http.post<Driver>("/drivers", payload);

  return data;
}

export async function updateDriver(
  id: string,
  payload: Partial<DriverInput>,
): Promise<Driver> {
  const { data } = await http.patch<Driver>(`/drivers/${id}`, payload);

  return data;
}

export async function listDrivers(
  params: ListDriversParams,
): Promise<Paginated<Driver>> {
  const { data } = await http.get<Paginated<Driver>>("/drivers", {
    params: cleanParams(params),
  });

  return data;
}

export async function getDriver(id: string): Promise<Driver> {
  const { data } = await http.get<Driver>(`/drivers/${id}`);

  return data;
}

export async function deleteDriver(id: string): Promise<void> {
  await http.delete(`/drivers/${id}`);
}

export async function updateDriverStatus(
  id: string,
  action: DriverStatusAction,
): Promise<Driver> {
  const { data } = await http.patch<Driver>(`/drivers/${id}/${action}`);

  return data;
}
