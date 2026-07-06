"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  cancelCargo,
  createCargo,
  listCargo,
  updateCargo,
} from "@/services/cargo-service";
import type { ListCargoParams, UpdateCargoPayload } from "@/types/cargo";

const CARGO_KEY = "cargo";

export function useCargo(params: ListCargoParams) {
  return useQuery({
    queryKey: [CARGO_KEY, params],
    queryFn: () => listCargo(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCargo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CARGO_KEY] });
    },
  });
}

export function useUpdateCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCargoPayload;
    }) => updateCargo(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CARGO_KEY] });
    },
  });
}

export function useCancelCargo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelCargo(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CARGO_KEY] });
    },
  });
}
