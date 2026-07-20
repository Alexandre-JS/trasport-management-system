"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createClient,
  deleteClient,
  getClientShareToken,
  listClients,
  regenerateClientShareToken,
  setClientActive,
  updateClient,
} from "@/services/clients-service";
import type { ClientInput, ListClientsParams } from "@/types/client";

const CLIENTS_KEY = "clients";

export function useClientShareToken(id: string | null) {
  return useQuery({
    queryKey: [CLIENTS_KEY, "share-token", id],
    queryFn: () => getClientShareToken(id as string),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRegenerateClientShareToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => regenerateClientShareToken(id),
    onSuccess: (_token, id) => {
      void queryClient.invalidateQueries({
        queryKey: [CLIENTS_KEY, "share-token", id],
      });
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClientInput) => createClient(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientInput }) =>
      updateClient(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY] });
    },
  });
}

export function useClients(params: ListClientsParams) {
  return useQuery({
    queryKey: [CLIENTS_KEY, params],
    queryFn: () => listClients(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY] });
    },
  });
}

export function useSetClientActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setClientActive(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [CLIENTS_KEY] });
    },
  });
}
