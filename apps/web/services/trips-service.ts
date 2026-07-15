import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type {
  AssignCargoPayload,
  AssignDriverPayload,
  AssignTrailerPayload,
  AssignTruckPayload,
  CreateTripPayload,
  ListTripsParams,
  RecordTripEventPayload,
  Trip,
  UpdateTripStatusPayload,
  UpdateTripPayload,
} from "@/types/trip";
import { cleanParams } from "@/utils/query-params";

export async function listTrips(
  params: ListTripsParams,
): Promise<Paginated<Trip>> {
  const { data } = await http.get<Paginated<Trip>>("/trips", {
    params: cleanParams(params),
  });

  return data;
}

export async function getTrip(id: string): Promise<Trip> {
  const { data } = await http.get<Trip>(`/trips/${id}`);

  return data;
}

export async function createTrip(payload: CreateTripPayload): Promise<Trip> {
  const { data } = await http.post<Trip>("/trips", payload);

  return data;
}

export async function updateTrip(
  id: string,
  payload: UpdateTripPayload,
): Promise<Trip> {
  const { data } = await http.patch<Trip>(`/trips/${id}`, payload);
  return data;
}

export async function cancelTrip(id: string): Promise<Trip> {
  const { data } = await http.patch<Trip>(`/trips/${id}/cancel`);

  return data;
}

export async function closeTrip(id: string): Promise<Trip> {
  const { data } = await http.patch<Trip>(`/trips/${id}/close`);

  return data;
}

export async function assignDriver(
  id: string,
  payload: AssignDriverPayload,
): Promise<Trip> {
  const { data } = await http.patch<Trip>(
    `/trips/${id}/assign-driver`,
    payload,
  );

  return data;
}

export async function assignTruck(
  id: string,
  payload: AssignTruckPayload,
): Promise<Trip> {
  const { data } = await http.patch<Trip>(`/trips/${id}/assign-truck`, payload);

  return data;
}

export async function assignTrailer(
  id: string,
  payload: AssignTrailerPayload,
): Promise<Trip> {
  const { data } = await http.patch<Trip>(
    `/trips/${id}/assign-trailer`,
    payload,
  );

  return data;
}

export async function assignCargo(
  id: string,
  payload: AssignCargoPayload,
): Promise<Trip> {
  const { data } = await http.patch<Trip>(`/trips/${id}/assign-cargo`, payload);

  return data;
}

export async function updateTripStatus(
  id: string,
  payload: UpdateTripStatusPayload,
): Promise<Trip> {
  const { data } = await http.patch<Trip>(`/trips/${id}/status`, payload);

  return data;
}

export async function recordTripEvent(
  id: string,
  payload: RecordTripEventPayload,
): Promise<Trip> {
  const { data } = await http.post<Trip>(`/trips/${id}/events`, payload);

  return data;
}
