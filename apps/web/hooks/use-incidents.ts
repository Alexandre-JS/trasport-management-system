"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { listIncidents, resolveIncident } from "@/services/incidents-service";
import type { ListIncidentsParams } from "@/types/incident";

const INCIDENTS_KEY = "incidents";

export function useIncidents(params: ListIncidentsParams) {
  return useQuery({
    queryKey: [INCIDENTS_KEY, params],
    queryFn: () => listIncidents(params),
    placeholderData: keepPreviousData,
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resolveIncident(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
    },
  });
}
