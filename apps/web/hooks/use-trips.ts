"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  assignCargo,
  assignDriver,
  assignTrailer,
  assignTruck,
  cancelTrip,
  closeTrip,
  createTrip,
  deleteTrip,
  getTrip,
  listTrips,
  recordTripEvent,
  updateTrip,
  updateTripStatus,
} from "@/services/trips-service";
import type {
  AssignCargoPayload,
  AssignDriverPayload,
  AssignTrailerPayload,
  AssignTruckPayload,
  CreateTripPayload,
  ListTripsParams,
  RecordTripEventPayload,
  UpdateTripPayload,
  UpdateTripStatusPayload,
} from "@/types/trip";

const TRIPS_KEY = "trips";

export const tripKeys = {
  all: [TRIPS_KEY] as const,
  list: (params: ListTripsParams) => [TRIPS_KEY, "list", params] as const,
  detail: (id: string) => [TRIPS_KEY, "detail", id] as const,
};

export function useTrips(
  params: ListTripsParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: tripKeys.list(params),
    queryFn: () => listTrips(params),
    enabled: options.enabled,
    placeholderData: keepPreviousData,
  });
}

export function useTrip(id: string | null) {
  return useQuery({
    queryKey: tripKeys.detail(id ?? ""),
    queryFn: () => getTrip(id as string),
    enabled: id !== null,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTripPayload) => createTrip(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["cargo"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
      void queryClient.invalidateQueries({ queryKey: ["trucks"] });
      void queryClient.invalidateQueries({ queryKey: ["trailers"] });
    },
  });
}

/** Invalidate both the lists and the affected detail after a trip mutation. */
function useTripMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  getId: (args: TArgs) => string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (_data, args) => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      void queryClient.invalidateQueries({
        queryKey: tripKeys.detail(getId(args)),
      });
    },
  });
}

export function useCancelTrip() {
  return useTripMutation(
    (id: string) => cancelTrip(id),
    (id) => id,
  );
}

export function useCloseTrip() {
  return useTripMutation(
    (id: string) => closeTrip(id),
    (id) => id,
  );
}

export function useAssignDriver() {
  return useTripMutation(
    (vars: { id: string; payload: AssignDriverPayload }) =>
      assignDriver(vars.id, vars.payload),
    (vars) => vars.id,
  );
}

export function useAssignTruck() {
  return useTripMutation(
    (vars: { id: string; payload: AssignTruckPayload }) =>
      assignTruck(vars.id, vars.payload),
    (vars) => vars.id,
  );
}

export function useAssignTrailer() {
  return useTripMutation(
    (vars: { id: string; payload: AssignTrailerPayload }) =>
      assignTrailer(vars.id, vars.payload),
    (vars) => vars.id,
  );
}

export function useAssignCargo() {
  return useTripMutation(
    (vars: { id: string; payload: AssignCargoPayload }) =>
      assignCargo(vars.id, vars.payload),
    (vars) => vars.id,
  );
}

export function useUpdateTrip() {
  return useTripMutation(
    (vars: { id: string; payload: UpdateTripPayload }) =>
      updateTrip(vars.id, vars.payload),
    (vars) => vars.id,
  );
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
      void queryClient.invalidateQueries({ queryKey: ["trucks"] });
      void queryClient.invalidateQueries({ queryKey: ["trailers"] });
    },
  });
}

export function useUpdateTripStatus() {
  return useTripMutation(
    (vars: { id: string; payload: UpdateTripStatusPayload }) =>
      updateTripStatus(vars.id, vars.payload),
    (vars) => vars.id,
  );
}

export function useRecordTripEvent() {
  return useTripMutation(
    (vars: { id: string; payload: RecordTripEventPayload }) =>
      recordTripEvent(vars.id, vars.payload),
    (vars) => vars.id,
  );
}
