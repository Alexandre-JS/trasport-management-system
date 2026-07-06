import { http } from "@/services/http";
import type { Paginated } from "@/types/api";
import type {
  ListTrailersParams,
  Trailer,
  TrailerInput,
  TrailerStatusAction,
} from "@/types/trailer";
import { cleanParams } from "@/utils/query-params";

export async function createTrailer(payload: TrailerInput): Promise<Trailer> {
  const { data } = await http.post<Trailer>("/trailers", payload);

  return data;
}

export async function updateTrailer(
  id: string,
  payload: TrailerInput,
): Promise<Trailer> {
  const { data } = await http.patch<Trailer>(`/trailers/${id}`, payload);

  return data;
}

export async function listTrailers(
  params: ListTrailersParams,
): Promise<Paginated<Trailer>> {
  const { data } = await http.get<Paginated<Trailer>>("/trailers", {
    params: cleanParams(params),
  });

  return data;
}

export async function deleteTrailer(id: string): Promise<void> {
  await http.delete(`/trailers/${id}`);
}

export async function updateTrailerStatus(
  id: string,
  action: TrailerStatusAction,
): Promise<Trailer> {
  const { data } = await http.patch<Trailer>(`/trailers/${id}/${action}`);

  return data;
}
