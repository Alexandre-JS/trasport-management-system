"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTruck,
  deleteTruck,
  listTrucks,
  updateTruck,
  updateTruckStatus,
} from "@/services/trucks-service";
import type {
  ListTrucksParams,
  TruckInput,
  TruckStatusAction,
} from "@/types/truck";

const TRUCKS_KEY = "trucks";

export function useCreateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TruckInput) => createTruck(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TRUCKS_KEY] });
    },
  });
}

export function useUpdateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TruckInput }) =>
      updateTruck(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TRUCKS_KEY] });
    },
  });
}

export function useTrucks(params: ListTrucksParams) {
  return useQuery({
    queryKey: [TRUCKS_KEY, params],
    queryFn: () => listTrucks(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTruck(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TRUCKS_KEY] });
    },
  });
}

export function useTruckStatusAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: TruckStatusAction }) =>
      updateTruckStatus(id, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TRUCKS_KEY] });
    },
  });
}
