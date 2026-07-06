"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTrailer,
  deleteTrailer,
  listTrailers,
  updateTrailer,
  updateTrailerStatus,
} from "@/services/trailers-service";
import type {
  ListTrailersParams,
  TrailerInput,
  TrailerStatusAction,
} from "@/types/trailer";

const TRAILERS_KEY = "trailers";
const TRUCKS_KEY = "trucks";

function invalidateFleet(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: [TRAILERS_KEY] });
  void queryClient.invalidateQueries({ queryKey: [TRUCKS_KEY] });
}

export function useCreateTrailer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TrailerInput) => createTrailer(payload),
    onSuccess: () => invalidateFleet(queryClient),
  });
}

export function useUpdateTrailer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TrailerInput }) =>
      updateTrailer(id, payload),
    onSuccess: () => invalidateFleet(queryClient),
  });
}

export function useTrailers(params: ListTrailersParams) {
  return useQuery({
    queryKey: [TRAILERS_KEY, params],
    queryFn: () => listTrailers(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteTrailer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrailer(id),
    onSuccess: () => invalidateFleet(queryClient),
  });
}

export function useTrailerStatusAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: TrailerStatusAction;
    }) => updateTrailerStatus(id, action),
    onSuccess: () => invalidateFleet(queryClient),
  });
}
