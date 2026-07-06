"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createDriver,
  deleteDriver,
  listDrivers,
  updateDriver,
  updateDriverStatus,
} from "@/services/drivers-service";
import type {
  DriverInput,
  DriverStatusAction,
  ListDriversParams,
} from "@/types/driver";

const DRIVERS_KEY = "drivers";

export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DriverInput) => createDriver(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DriverInput }) =>
      updateDriver(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
    },
  });
}

export function useDrivers(params: ListDriversParams) {
  return useQuery({
    queryKey: [DRIVERS_KEY, params],
    queryFn: () => listDrivers(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDriver(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
    },
  });
}

export function useDriverStatusAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: DriverStatusAction }) =>
      updateDriverStatus(id, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DRIVERS_KEY] });
    },
  });
}
